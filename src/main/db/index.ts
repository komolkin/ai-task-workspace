import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import { runMigrations } from './migrations'
import { seedIfEmpty } from './seed'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const userData = app.getPath('userData')
    const dbPath = path.join(userData, 'ai-task-workspace.db')
    db = new Database(dbPath)
    runMigrations(db)
    seedIfEmpty(db)
  }
  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
