import type { IProvider, StructuredOutput } from './types'

const MOCK_OUTPUTS: StructuredOutput[] = [
  {
    summary: 'Task clarified and broken into steps.',
    nextStep: 'Start with the first checklist item.',
    details: 'Follow the checklist in order. Each step builds on the previous one.',
    checklist: ['Gather requirements', 'Draft solution', 'Review and iterate'],
  },
  {
    summary: 'Structured plan generated.',
    nextStep: 'Execute the first action.',
    details: 'Detailed instructions for each step are above.',
    checklist: ['Step 1: Setup', 'Step 2: Implement', 'Step 3: Test'],
  },
]

export const mockProvider: IProvider = {
  id: 'mock',
  name: 'Mock',
  async sendPrompt(_prompt: string, _model: string): Promise<{ output: StructuredOutput; usage?: { tokensUsed: number; maxTokens: number } }> {
    await new Promise((r) => setTimeout(r, 800))
    const output = MOCK_OUTPUTS[Math.floor(Math.random() * MOCK_OUTPUTS.length)]!
    return {
      output,
      usage: { tokensUsed: 100, maxTokens: 200_000 },
    }
  },
  async listModels() {
    return ['mock-model']
  },
}
