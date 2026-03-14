import type Database from 'better-sqlite3'
import { safeStorage } from 'electron'

const ENCRYPTED_PREFIX = '__encrypted:'

function getKey(db: Database.Database, key: string): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  if (!row?.value) return ''
  if (row.value.startsWith(ENCRYPTED_PREFIX) && safeStorage.isEncryptionAvailable()) {
    const buf = Buffer.from(row.value.slice(ENCRYPTED_PREFIX.length), 'base64')
    return safeStorage.decryptString(buf)
  }
  return row.value
}

function setKey(db: Database.Database, key: string, value: string): void {
  let stored = value
  if (value && safeStorage.isEncryptionAvailable()) {
    const buf = safeStorage.encryptString(value)
    stored = ENCRYPTED_PREFIX + buf.toString('base64')
  }
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, stored)
}

export function get(db: Database.Database): {
  provider: string
  defaultModel: string
  hasApiKey: boolean
} {
  const providerRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('provider') as { value: string } | undefined
  const modelRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('defaultModel') as { value: string } | undefined
  const apiKeyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('apiKey') as { value: string } | undefined
  return {
    provider: providerRow?.value ?? 'openai',
    defaultModel: modelRow?.value ?? '',
    hasApiKey: !!(apiKeyRow?.value),
  }
}

export function set(
  db: Database.Database,
  data: { provider?: string; defaultModel?: string; apiKey?: string }
): void {
  if (data.provider !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('provider', data.provider)
  }
  if (data.defaultModel !== undefined) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('defaultModel', data.defaultModel)
  }
  if (data.apiKey !== undefined) {
    setKey(db, 'apiKey', data.apiKey)
  }
}

export function getApiKey(db: Database.Database): string {
  return getKey(db, 'apiKey')
}
