import type Database from 'better-sqlite3'

export function seedIfEmpty(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }
  if (count.c > 0) return
  const now = Date.now()
  db.prepare(
    'INSERT INTO tasks (id, title, description, "column", status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    'Plan a weekend project',
    'Pick a small idea and break it into steps.',
    'todo',
    'active',
    now,
    now
  )
  db.prepare(
    'INSERT INTO tasks (id, title, description, "column", status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    'Review API design',
    'Check the new endpoints for consistency.',
    'todo',
    'active',
    now - 86400_000,
    now - 86400_000
  )
  db.prepare(
    'INSERT INTO automations (id, title, instruction, schedule, enabled, outputMode, lastRunAt, nextRunAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    'Daily movie suggestion',
    'Suggest one movie to watch today. Consider mood and recent releases.',
    '0 18 * * *',
    1,
    'review',
    null,
    now + 60_000,
    now,
    now
  )
  db.prepare(
    'INSERT INTO automations (id, title, instruction, schedule, enabled, outputMode, lastRunAt, nextRunAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    'Morning briefing',
    'Summarize top 3 things to focus on today.',
    '0 9 * * *',
    0,
    'review',
    null,
    now + 3600_000,
    now,
    now
  )
}
