import OpenAI from 'openai'
import type { IProvider, StructuredOutput, SendPromptResult } from './types'

function normalize(o: unknown): StructuredOutput {
  const x = o as Record<string, unknown>
  return {
    summary: typeof x.summary === 'string' ? x.summary : '',
    nextStep: typeof x.nextStep === 'string' ? x.nextStep : '',
    details: typeof x.details === 'string' ? x.details : '',
    checklist: Array.isArray(x.checklist) ? x.checklist.filter((i): i is string => typeof i === 'string') : [],
  }
}

export function createOpenAIProvider(apiKey: string): IProvider {
  return {
    id: 'openai',
    name: 'OpenAI',
    async sendPrompt(
      prompt: string,
      model: string,
      options?: { systemPrompt?: string }
    ): Promise<SendPromptResult> {
      const client = new OpenAI({ apiKey: apiKey || 'sk-placeholder' })
      const sys = options?.systemPrompt ?? 'You are a helpful assistant. Return only valid JSON with keys: summary, nextStep, details, checklist (array of strings).'
      const res = await client.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      })
      const choice = res.choices?.[0]
      const content = choice?.message?.content?.trim() ?? '{}'
      let output: StructuredOutput
      try {
        output = normalize(JSON.parse(content) as unknown)
      } catch {
        output = { summary: content, nextStep: '', details: '', checklist: [] }
      }
      const usage = res.usage
      return {
        output,
        usage: usage ? { tokensUsed: usage.total_tokens ?? 0, maxTokens: 200_000 } : undefined,
      }
    },
    async listModels() {
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
  }
}
