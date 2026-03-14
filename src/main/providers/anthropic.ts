import Anthropic from '@anthropic-ai/sdk'
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

export function createAnthropicProvider(apiKey: string): IProvider {
  return {
    id: 'anthropic',
    name: 'Anthropic',
    async sendPrompt(
      prompt: string,
      model: string,
      options?: { systemPrompt?: string }
    ): Promise<SendPromptResult> {
      const client = new Anthropic({ apiKey: apiKey || 'placeholder' })
      const sys = options?.systemPrompt ?? 'You are a helpful assistant. Return only valid JSON with keys: summary, nextStep, details, checklist (array of strings).'
      const res = await client.messages.create({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: sys,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = res.content?.find((c) => c.type === 'text')
      const content = (text && 'text' in text ? text.text : '')?.trim() ?? '{}'
      let output: StructuredOutput
      try {
        const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, '')) as unknown
        output = normalize(parsed)
      } catch {
        output = { summary: content, nextStep: '', details: '', checklist: [] }
      }
      const usage = res.usage
      return {
        output,
        usage: usage ? { tokensUsed: usage.input_tokens + usage.output_tokens, maxTokens: 200_000 } : undefined,
      }
    },
    async listModels() {
      return ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
    },
  }
}
