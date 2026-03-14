import type Database from 'better-sqlite3'
import type { Task } from './taskService'
import type { StructuredOutput } from '../providers/types'
import { getProvider } from '../providers/resolver'
import { getDb } from '../db'
import * as taskService from './taskService'
import * as modelUsageService from './modelUsageService'
import * as settingsService from './settingsService'

const STAGES = ['Understanding task', 'Structuring', 'Drafting response', 'Finalizing', 'Ready for review'] as const

function getFullPrompt(task: Task): string {
  return [task.title, task.description].filter(Boolean).join('\n\n')
}

export async function runPipelineForTask(
  db: Database.Database,
  taskId: string,
  onStage: (stage: string) => void,
  onTaskUpdated: (task: Task | null) => void,
  onUsageRecorded?: () => void
): Promise<void> {
  const task = taskService.getById(db, taskId)
  if (!task) return
  const settings = settingsService.get(db)
  const provider = getProvider(settings.provider, db)
  const model = settings.defaultModel || (await provider.listModels?.())?.[0] || 'default'
  const runId = crypto.randomUUID()
  const startedAt = Date.now()
  db.prepare(
    'INSERT INTO task_runs (id, taskId, provider, model, prompt, rawOutput, structuredOutput, status, startedAt, finishedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(runId, taskId, provider.id, model, getFullPrompt(task), null, null, 'running', startedAt, null)

  try {
    for (let i = 0; i < STAGES.length - 1; i++) {
      onStage(STAGES[i]!)
      await new Promise((r) => setTimeout(r, 300))
    }
    onStage(STAGES[STAGES.length - 1]!)

    const fullPrompt = getFullPrompt(task)
    const systemPrompt = `You are a task processor. Return ONLY valid JSON with keys: summary (string), nextStep (string), details (string), checklist (array of strings). No markdown, no explanation.`
    const result = await provider.sendPrompt(fullPrompt, model, { systemPrompt })
    const output = result.output
    const rawOutput = JSON.stringify(output)

    db.prepare(
      'UPDATE task_runs SET rawOutput = ?, structuredOutput = ?, status = ?, finishedAt = ? WHERE id = ?'
    ).run(rawOutput, rawOutput, 'completed', Date.now(), runId)

    db.prepare('DELETE FROM review_drafts WHERE taskId = ?').run(taskId)
    const draftId = crypto.randomUUID()
    db.prepare(
      'INSERT INTO review_drafts (id, taskId, summary, nextStep, details, checklist, editedDetails, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      draftId,
      taskId,
      output.summary,
      output.nextStep,
      output.details,
      JSON.stringify(output.checklist),
      null,
      null
    )

    if (result.usage) {
      modelUsageService.record(db, {
        model: `${provider.name} — ${model}`,
        tokensUsed: result.usage.tokensUsed,
        maxTokens: result.usage.maxTokens,
      })
      onUsageRecorded?.()
    }

    const now = Date.now()
    db.prepare('UPDATE tasks SET "column" = ?, updatedAt = ? WHERE id = ?').run('review', now, taskId)
    const updated = taskService.getById(db, taskId)
    onTaskUpdated(updated)
  } catch (err) {
    db.prepare('UPDATE task_runs SET status = ?, finishedAt = ? WHERE id = ?').run('failed', Date.now(), runId)
    throw err
  }
}

export async function runPipelineForAutomation(db: Database.Database, automationId: string): Promise<Task | null> {
  const row = db.prepare('SELECT * FROM automations WHERE id = ? AND enabled = 1').get(automationId) as {
    id: string
    title: string
    instruction: string
    outputMode: string
  } | undefined
  if (!row) return null
  const settings = settingsService.get(db)
  const provider = getProvider(settings.provider, db)
  const model = settings.defaultModel || (await provider.listModels?.())?.[0] || 'default'
  const result = await provider.sendPrompt(row.instruction, model, {
    systemPrompt: 'Return ONLY valid JSON with keys: summary, nextStep, details, checklist (array of strings).',
  })
  const output = result.output
  const now = Date.now()
  const taskId = crypto.randomUUID()
  db.prepare(
    'INSERT INTO tasks (id, title, description, "column", status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    taskId,
    row.title,
    output.summary,
    row.outputMode === 'in_progress' ? 'in_progress' : 'review',
    'active',
    now,
    now
  )
  if (row.outputMode === 'review') {
    const draftId = crypto.randomUUID()
    db.prepare(
      'INSERT INTO review_drafts (id, taskId, summary, nextStep, details, checklist, editedDetails, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      draftId,
      taskId,
      output.summary,
      output.nextStep,
      output.details,
      JSON.stringify(output.checklist),
      null,
      null
    )
  }
  const nextRunAt = now + 60_000
  db.prepare('UPDATE automations SET lastRunAt = ?, nextRunAt = ? WHERE id = ?').run(now, nextRunAt, automationId)
  if (result.usage) {
    modelUsageService.record(db, {
      model: `${provider.name} — ${model}`,
      tokensUsed: result.usage.tokensUsed,
      maxTokens: result.usage.maxTokens,
    })
  }
  return taskService.getById(db, taskId)
}
