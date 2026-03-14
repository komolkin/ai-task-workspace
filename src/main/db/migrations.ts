import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database) {
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      column TEXT NOT NULL DEFAULT 'todo',
      status TEXT NOT NULL DEFAULT 'active',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_runs (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt TEXT,
      rawOutput TEXT,
      structuredOutput TEXT,
      status TEXT NOT NULL,
      startedAt INTEGER NOT NULL,
      finishedAt INTEGER,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS review_drafts (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      nextStep TEXT NOT NULL,
      details TEXT NOT NULL,
      checklist TEXT NOT NULL,
      editedDetails TEXT,
      approvedAt INTEGER,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instruction TEXT NOT NULL,
      schedule TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      outputMode TEXT NOT NULL DEFAULT 'review',
      lastRunAt INTEGER,
      nextRunAt INTEGER,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_usage (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      tokensUsed INTEGER NOT NULL DEFAULT 0,
      maxTokens INTEGER NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      lastUsedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column);
    CREATE INDEX IF NOT EXISTS idx_task_runs_taskId ON task_runs(taskId);
    CREATE INDEX IF NOT EXISTS idx_automations_enabled_nextRun ON automations(enabled, nextRunAt);
  `)
}
