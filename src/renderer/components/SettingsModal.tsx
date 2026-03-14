import { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      settingsGet: () => Promise<{ provider: string; defaultModel: string; hasApiKey: boolean }>
      settingsSet: (data: { provider?: string; defaultModel?: string; apiKey?: string }) => Promise<void>
    }
  }
}

const PROVIDERS = [
  { id: 'mock', name: 'Mock (no API key)' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'ollama', name: 'Ollama' },
  { id: 'openrouter', name: 'OpenRouter' },
]

type Props = {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const [provider, setProvider] = useState('mock')
  const [defaultModel, setDefaultModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.electronAPI?.settingsGet().then((s) => {
      if (s) {
        setProvider(s.provider)
        setDefaultModel(s.defaultModel)
        setHasApiKey(s.hasApiKey)
      }
    }).catch((err) => {
      console.error('settingsGet failed:', err)
    })
  }, [])

  const handleSave = async () => {
    if (!window.electronAPI) return
    setLoading(true)
    try {
      await window.electronAPI.settingsSet({
        provider,
        defaultModel: defaultModel || undefined,
        apiKey: apiKey || undefined,
      })
      if (apiKey) setHasApiKey(true)
      setApiKey('')
      onClose()
    } catch (err) {
      console.error('settingsSet failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg w-full max-w-md mx-4 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100 mb-4">Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="select-with-arrow w-full pl-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Default model
            </label>
            <input
              type="text"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="e.g. gpt-4o, claude-sonnet"
              className="w-full px-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>
          {provider !== 'mock' && (
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                API key {hasApiKey && <span className="text-neutral-400">(set)</span>}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave blank to keep existing"
                className="w-full px-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
              />
            </div>
          )}
          {provider === 'mock' && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Mock provider is active. No API key needed.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
