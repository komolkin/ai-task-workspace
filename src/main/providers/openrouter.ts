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

export function createOpenRouterProvider(apiKey: string): IProvider {
  return {
    id: 'openrouter',
    name: 'OpenRouter',
    async sendPrompt(
      prompt: string,
      model: string,
      options?: { systemPrompt?: string }
    ): Promise<SendPromptResult> {
      const sys = options?.systemPrompt ?? 'Return only valid JSON with keys: summary, nextStep, details, checklist (array of strings).'
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || 'placeholder'}`,
          'HTTP-Referer': 'https://ai-task-workspace.local',
        },
        body: JSON.stringify({
          model: model || 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt },
          ],
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
      })
      if (!res.ok) throw new Error(`OpenRouter: ${res.status}`)
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } }
      const content = data.choices?.[0]?.message?.content?.trim() ?? '{}'
      let output: StructuredOutput
      try {
        output = normalize(JSON.parse(content) as unknown)
      } catch {
        output = { summary: content, nextStep: '', details: '', checklist: [] }
      }
      const usage = data.usage
      return {
        output,
        usage: usage ? { tokensUsed: usage.total_tokens ?? 0, maxTokens: 200_000 } : undefined,
      }
    },
    async listModels() {
      return ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-sonnet-4', 'anthropic/claude-3.5-haiku']
    },
  }
}
