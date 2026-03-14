import type Database from 'better-sqlite3'

export type ReviewDraft = {
  id: string
  taskId: string
  summary: string
  nextStep: string
  details: string
  checklist: string
  editedDetails: string | null
  approvedAt: number | null
}

export function getByTaskId(db: Database.Database, taskId: string): ReviewDraft | null {
  const row = db.prepare('SELECT * FROM review_drafts WHERE taskId = ?').get(taskId) as ReviewDraft | undefined
  return row ?? null
}

export function update(
  db: Database.Database,
  draftId: string,
  data: { editedDetails?: string; checklist?: string[] }
): ReviewDraft | null {
  const draft = db.prepare('SELECT * FROM review_drafts WHERE id = ?').get(draftId) as ReviewDraft | undefined
  if (!draft) return null
  if (data.editedDetails !== undefined) {
    db.prepare('UPDATE review_drafts SET editedDetails = ? WHERE id = ?').run(data.editedDetails, draftId)
  }
  if (data.checklist !== undefined) {
    db.prepare('UPDATE review_drafts SET checklist = ? WHERE id = ?').run(JSON.stringify(data.checklist), draftId)
  }
  return db.prepare('SELECT * FROM review_drafts WHERE id = ?').get(draftId) as ReviewDraft
}

export function approve(db: Database.Database, taskId: string): unknown {
  const now = Date.now()
  db.prepare('UPDATE review_drafts SET approvedAt = ? WHERE taskId = ?').run(now, taskId)
  db.prepare('UPDATE tasks SET "column" = ?, updatedAt = ? WHERE id = ?').run('done', now, taskId)
  return { ok: true }
}

export function sendToTodo(db: Database.Database, taskId: string): unknown {
  const now = Date.now()
  db.prepare('UPDATE tasks SET "column" = ?, updatedAt = ? WHERE id = ?').run('review', now, taskId)
  db.prepare('DELETE FROM review_drafts WHERE taskId = ?').run(taskId)
  return { ok: true }
}
