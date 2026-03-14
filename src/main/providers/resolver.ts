import type Database from 'better-sqlite3'
import type { IProvider } from './types'
import { mockProvider } from './mock'
import { createOpenAIProvider } from './openai'
import { createAnthropicProvider } from './anthropic'
import { createOllamaProvider } from './ollama'
import { createOpenRouterProvider } from './openrouter'
import { getApiKey } from '../services/settingsService'

export function getProvider(providerId: string, db: Database.Database): IProvider {
  const apiKey = getApiKey(db)
  switch (providerId) {
    case 'openai':
      return createOpenAIProvider(apiKey)
    case 'anthropic':
      return createAnthropicProvider(apiKey)
    case 'ollama':
      return createOllamaProvider(apiKey)
    case 'openrouter':
      return createOpenRouterProvider(apiKey)
    default:
      return mockProvider
  }
}
