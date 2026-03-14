import type Database from 'better-sqlite3'
import { getProvider } from '../providers/resolver'
import * as settingsService from './settingsService'
import * as modelUsageService from './modelUsageService'

const TITLE_SYSTEM_PROMPT = `You are a title generator. Return ONLY valid JSON with keys: summary, nextStep, details, checklist (array of strings).
Set "summary" to a very short title (2-6 words) that summarizes the user's text. Use proper grammar. No quotes in the title.
Set "nextStep" and "details" to empty strings. Set "checklist" to an empty array.`

function fallbackTitle(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return 'Untitled'
  const words = trimmed.split(/\s+/).filter(Boolean).slice(0, 6)
  return words.join(' ') || 'Untitled'
}

export async function generateTitle(db: Database.Database, text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return 'Untitled'

  const settings = settingsService.get(db)
  const provider = getProvider(settings.provider, db)
  const model = settings.defaultModel || (await provider.listModels?.())?.[0] || 'default'

  try {
    const result = await provider.sendPrompt(trimmed, model, {
      systemPrompt: TITLE_SYSTEM_PROMPT,
    })
    if (result.usage) {
      modelUsageService.record(db, {
        model: `${provider.name} — ${model}`,
        tokensUsed: result.usage.tokensUsed,
        maxTokens: result.usage.maxTokens,
      })
    }
    const title = (result.output.summary || '').trim()
    return title || fallbackTitle(trimmed)
  } catch {
    return fallbackTitle(trimmed)
  }
}
