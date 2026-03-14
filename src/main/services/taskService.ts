import type Database from 'better-sqlite3'

export type Task = {
  id: string
  title: string
  description: string | null
  column: string
  status: string
  createdAt: number
  updatedAt: number
}

export function getAll(db: Database.Database): Task[] {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY updatedAt DESC').all() as Task[]
  return rows
}

export function create(
  db: Database.Database,
  data: { title: string; description?: string }
): Task {
  const id = crypto.randomUUID()
  const now = Date.now()
  db.prepare(
    'INSERT INTO tasks (id, title, description, "column", status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, data.title, data.description ?? null, 'todo', 'active', now, now)
  return getById(db, id)!
}

export function getById(db: Database.Database, id: string): Task | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined
  return row ?? null
}

export function remove(db: Database.Database, taskId: string): void {
  db.prepare('DELETE FROM review_drafts WHERE taskId = ?').run(taskId)
  db.prepare('DELETE FROM task_runs WHERE taskId = ?').run(taskId)
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId)
}

export function updateColumn(db: Database.Database, taskId: string, column: string): Task | null {
  const now = Date.now()
  db.prepare('UPDATE tasks SET "column" = ?, updatedAt = ? WHERE id = ?').run(column, now, taskId)
  return getById(db, taskId)
}

export async function moveToInProgress(
  db: Database.Database,
  taskId: string,
  onStage: (stage: string) => void,
  onTaskUpdated: (task: Task) => void,
  onUsageRecorded?: () => void
): Promise<void> {
  const { runPipelineForTask } = await import('./pipeline')
  const now = Date.now()
  db.prepare('UPDATE tasks SET "column" = ?, updatedAt = ? WHERE id = ?').run('in_progress', now, taskId)
  const taskInProgress = getById(db, taskId)
  if (taskInProgress) onTaskUpdated(taskInProgress)
  onStage('Understanding task')
  try {
    await runPipelineForTask(db, taskId, onStage, (task) => {
      if (task) onTaskUpdated(task)
    }, onUsageRecorded)
  } catch (err) {
    onStage('Error')
    throw err
  }
}

export async function retry(
  db: Database.Database,
  taskId: string,
  onStage: (stage: string) => void,
  onTaskUpdated: (task: Task) => void,
  onUsageRecorded?: () => void
): Promise<void> {
  const { runPipelineForTask } = await import('./pipeline')
  const now = Date.now()
  db.prepare('UPDATE tasks SET "column" = ?, updatedAt = ? WHERE id = ?').run('in_progress', now, taskId)
  const taskInProgress = getById(db, taskId)
  if (taskInProgress) onTaskUpdated(taskInProgress)
  onStage('Understanding task')
  await runPipelineForTask(db, taskId, onStage, (task) => {
    if (task) onTaskUpdated(task)
  }, onUsageRecorded)
}
