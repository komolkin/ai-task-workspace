export interface StructuredOutput {
  summary: string
  nextStep: string
  details: string
  checklist: string[]
}

export interface SendPromptOptions {
  systemPrompt?: string
}

export interface SendPromptResult {
  output: StructuredOutput
  usage?: { tokensUsed: number; maxTokens: number }
}

export interface IProvider {
  id: string
  name: string
  sendPrompt(
    prompt: string,
    model: string,
    options?: SendPromptOptions
  ): Promise<SendPromptResult>
  listModels?(): Promise<string[]>
}
