import type Database from 'better-sqlite3'

export type ModelUsage = {
  id: string
  model: string
  tokensUsed: number
  maxTokens: number
  percentage: number
  lastUsedAt: number
}

export function getAll(db: Database.Database): ModelUsage[] {
  const rows = db
    .prepare(
      'SELECT * FROM model_usage ORDER BY lastUsedAt DESC'
    )
    .all() as ModelUsage[]
  return rows
}

export function record(
  db: Database.Database,
  data: { model: string; tokensUsed: number; maxTokens: number }
): void {
  const id = crypto.randomUUID()
  const percentage = data.maxTokens > 0 ? (data.tokensUsed / data.maxTokens) * 100 : 0
  const now = Date.now()
  const existing = db.prepare('SELECT id FROM model_usage WHERE model = ?').get(data.model) as { id: string } | undefined
  if (existing) {
    db.prepare(
      'UPDATE model_usage SET tokensUsed = ?, maxTokens = ?, percentage = ?, lastUsedAt = ? WHERE model = ?'
    ).run(data.tokensUsed, data.maxTokens, percentage, now, data.model)
  } else {
    db.prepare(
      'INSERT INTO model_usage (id, model, tokensUsed, maxTokens, percentage, lastUsedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.model, data.tokensUsed, data.maxTokens, percentage, now)
  }
}
