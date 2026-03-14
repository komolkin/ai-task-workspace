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

export function createOllamaProvider(_apiKey: string): IProvider {
  return {
    id: 'ollama',
    name: 'Ollama',
    async sendPrompt(
      prompt: string,
      model: string,
      options?: { systemPrompt?: string }
    ): Promise<SendPromptResult> {
      const sys = options?.systemPrompt ?? 'Return only valid JSON with keys: summary, nextStep, details, checklist (array of strings).'
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3.2',
          prompt: `${sys}\n\nUser: ${prompt}\n\nAssistant:`,
          stream: false,
          options: { num_predict: 4096 },
        }),
      })
      if (!res.ok) throw new Error(`Ollama: ${res.status}`)
      const data = (await res.json()) as { response?: string }
      const content = data.response?.trim() ?? '{}'
      let output: StructuredOutput
      try {
        const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, '')) as unknown
        output = normalize(parsed)
      } catch {
        output = { summary: content, nextStep: '', details: '', checklist: [] }
      }
      return { output, usage: { tokensUsed: 0, maxTokens: 128_000 } }
    },
    async listModels() {
      try {
        const res = await fetch('http://localhost:11434/api/tags')
        if (!res.ok) return ['llama3.2', 'mistral', 'codellama']
        const data = (await res.json()) as { models?: { name: string }[] }
        return (data.models ?? []).map((m) => m.name) as string[]
      } catch {
        return ['llama3.2', 'mistral', 'codellama']
      }
    },
  }
}
