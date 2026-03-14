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

function createAutomationTask(
  db: Database.Database,
  automationId: string,
  taskId: string,
  title: string,
  summary: string,
  nextStep: string,
  details: string,
  checklist: string[],
  now: number
): void {
  db.prepare(
    'INSERT INTO tasks (id, title, description, "column", status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(taskId, title, summary, 'review', 'active', now, now)
  const draftId = crypto.randomUUID()
  db.prepare(
    'INSERT INTO review_drafts (id, taskId, summary, nextStep, details, checklist, editedDetails, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    draftId,
    taskId,
    summary,
    nextStep,
    details,
    JSON.stringify(checklist),
    null,
    null
  )
  db.prepare('UPDATE automations SET lastRunAt = ?, nextRunAt = ? WHERE id = ?').run(now, now + 60_000, automationId)
}

export async function runPipelineForAutomation(db: Database.Database, automationId: string): Promise<Task | null> {
  const row = db.prepare('SELECT * FROM automations WHERE id = ? AND enabled = 1').get(automationId) as {
    id: string
    title: string
    instruction: string
    outputMode: string
  } | undefined
  if (!row) return null

  const now = Date.now()
  const taskId = crypto.randomUUID()
  const instruction = (row.instruction || '').trim() || row.title

  let summary: string
  let nextStep: string
  let details: string
  let checklist: string[]

  try {
    const settings = settingsService.get(db)
    const provider = getProvider(settings.provider, db)
    const model = settings.defaultModel || (await provider.listModels?.())?.[0] || 'default'
    const result = await provider.sendPrompt(instruction, model, {
      systemPrompt: `You are a content generator. The user's message is their request: they want you to CREATE that content (e.g. "Inspirational quote" = give a real quote, "Daily tip" = give a real tip, "Joke" = tell a joke). Do NOT plan, summarize, or describe what you would do — actually generate the requested content and put it in your response.

Return ONLY valid JSON with:
- summary: the main content they asked for (e.g. the actual quote, tip, or joke — this will be shown as the task card title)
- nextStep: one short sentence on what to do with it (e.g. "Reflect on it" or "Try it today")
- details: longer explanation, context, or the full content
- checklist: array of 0-3 optional follow-up steps (strings)

Vary your content each time. No markdown, no text outside the JSON.`,
    })
    const output = result.output
    summary = output.summary || instruction.slice(0, 200)
    nextStep = output.nextStep || 'Review and take action.'
    details = output.details || instruction
    checklist = Array.isArray(output.checklist) ? output.checklist : []
    if (result.usage) {
      modelUsageService.record(db, {
        model: `${provider.name} — ${model}`,
        tokensUsed: result.usage.tokensUsed,
        maxTokens: result.usage.maxTokens,
      })
    }
  } catch (err) {
    console.error('[automation] LLM failed, creating task from description:', err)
    summary = instruction.slice(0, 300) || row.title
    nextStep = 'Review and take action.'
    details = instruction || summary
    checklist = []
  }

  // Use generated content as the task title. Never show the bare automation title (e.g. "Inspirational quote") on every card — if the model echoed it or returned empty, make the title unique with time or use details.
  const instructionTrimmed = instruction.trim().toLowerCase()
  const summaryTrimmed = (summary || '').trim().toLowerCase()
  const detailsTrimmed = (details || '').trim().toLowerCase()
  const titleTrimmed = row.title.trim().toLowerCase()
  const timeSuffix = new Date(now).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const isSummaryEcho =
    !summary ||
    summaryTrimmed === instructionTrimmed ||
    summaryTrimmed === titleTrimmed
  const isDetailsEcho = !details || detailsTrimmed === instructionTrimmed || detailsTrimmed === titleTrimmed

  let taskTitle: string
  if (!isSummaryEcho && summaryTrimmed.length > 0) {
    taskTitle = summary.slice(0, 500)
  } else if (!isDetailsEcho && detailsTrimmed.length > 0) {
    taskTitle = details.slice(0, 500)
  } else {
    taskTitle = `${row.title} — ${timeSuffix}`
  }
  const taskDescription = details || summary
  createAutomationTask(db, automationId, taskId, taskTitle, taskDescription, nextStep, details, checklist, now)
  return taskService.getByIdWithDraft(db, taskId)
}
