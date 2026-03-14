import type Database from 'better-sqlite3'
import type { Task } from './taskService'
import { startScheduler, stopScheduler, refreshScheduler } from './automationScheduler'

export type Automation = {
  id: string
  title: string
  instruction: string
  schedule: string
  enabled: number
  outputMode: string
  lastRunAt: number | null
  nextRunAt: number | null
  createdAt: number
  updatedAt: number
}

export function list(db: Database.Database): Automation[] {
  const rows = db.prepare('SELECT * FROM automations ORDER BY createdAt DESC').all() as Automation[]
  return rows
}

export function create(
  db: Database.Database,
  data: {
    title: string
    instruction: string
    schedule: string
    enabled: boolean
    outputMode: 'review' | 'in_progress'
  }
): Automation {
  const id = crypto.randomUUID()
  const now = Date.now()
  const nextRunAt = computeNextRun(data.schedule, now)
  db.prepare(
    'INSERT INTO automations (id, title, instruction, schedule, enabled, outputMode, lastRunAt, nextRunAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    data.title,
    data.instruction,
    data.schedule,
    data.enabled ? 1 : 0,
    data.outputMode,
    null,
    nextRunAt,
    now,
    now
  )
  refreshScheduler(db)
  return db.prepare('SELECT * FROM automations WHERE id = ?').get(id) as Automation
}

export function update(
  db: Database.Database,
  id: string,
  data: {
    title?: string
    instruction?: string
    schedule?: string
    enabled?: boolean
    outputMode?: 'review' | 'in_progress'
  }
): Automation | null {
  const row = db.prepare('SELECT * FROM automations WHERE id = ?').get(id) as Automation | undefined
  if (!row) return null
  const now = Date.now()
  const updates: string[] = ['updatedAt = ?']
  const values: unknown[] = [now]
  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.instruction !== undefined) {
    updates.push('instruction = ?')
    values.push(data.instruction)
  }
  if (data.schedule !== undefined) {
    updates.push('schedule = ?')
    values.push(data.schedule)
    updates.push('nextRunAt = ?')
    values.push(computeNextRun(data.schedule, now))
  }
  if (data.enabled !== undefined) {
    updates.push('enabled = ?')
    values.push(data.enabled ? 1 : 0)
  }
  if (data.outputMode !== undefined) {
    updates.push('outputMode = ?')
    values.push(data.outputMode)
  }
  values.push(id)
  db.prepare(`UPDATE automations SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  refreshScheduler(db)
  return db.prepare('SELECT * FROM automations WHERE id = ?').get(id) as Automation
}

export function remove(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM automations WHERE id = ?').run(id)
  refreshScheduler(db)
}

function computeNextRun(_schedule: string, after: number): number {
  return after + 60_000
}

export function initScheduler(db: Database.Database, onTaskCreated?: (task: Task) => void) {
  startScheduler(db, onTaskCreated)
}
