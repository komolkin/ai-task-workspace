import type Database from 'better-sqlite3'
import cron from 'node-cron'
import type { Task } from './taskService'
import { runPipelineForAutomation } from './pipeline'

let cronTasks: Map<string, cron.ScheduledTask> = new Map()
let dbRef: Database.Database | null = null
let onTaskCreated: ((task: Task) => void) | null = null

export function startScheduler(db: Database.Database, onCreated?: (task: Task) => void) {
  dbRef = db
  onTaskCreated = onCreated ?? null
  refreshScheduler(db)
}

export function stopScheduler() {
  for (const t of cronTasks.values()) t.stop()
  cronTasks.clear()
  dbRef = null
  onTaskCreated = null
}

export function refreshScheduler(db: Database.Database) {
  for (const t of cronTasks.values()) t.stop()
  cronTasks.clear()
  const rows = db.prepare('SELECT id, schedule, enabled FROM automations WHERE enabled = 1').all() as {
    id: string
    schedule: string
    enabled: number
  }[]
  for (const row of rows) {
    try {
      const scheduled = cron.schedule(row.schedule, () => {
        if (!dbRef) return
        runPipelineForAutomation(dbRef, row.id)
          .then((task) => {
            if (task && onTaskCreated) onTaskCreated(task)
          })
          .catch(console.error)
      })
      cronTasks.set(row.id, scheduled)
    } catch (_) {
      // invalid cron expression
    }
  }
}
