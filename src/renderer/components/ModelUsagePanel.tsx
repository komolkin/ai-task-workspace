import { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      modelUsageGetAll: () => Promise<{ model: string; tokensUsed: number; maxTokens: number; percentage: number; lastUsedAt: number }[]>
      onModelUsageUpdated: (cb: () => void) => () => void
    }
  }
}

function formatTokens(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatAgo(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return `${Math.floor(diff / 86400_000)}d ago`
}

export function ModelUsagePanel() {
  const [usage, setUsage] = useState<{ model: string; tokensUsed: number; maxTokens: number; percentage: number; lastUsedAt: number }[]>([])
  const [open, setOpen] = useState(false)

  const load = () => {
    window.electronAPI?.modelUsageGetAll().then(setUsage).catch((err) => {
      console.error('modelUsageGetAll failed:', err)
    })
  }

  useEffect(() => {
    load()
    const unsub = window.electronAPI?.onModelUsageUpdated(load)
    return () => unsub?.()
  }, [])

  if (usage.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 rounded px-2 py-1.5 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
      >
        Context usage
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 rounded bg-white dark:bg-neutral-800 shadow-lg p-3 space-y-2">
          <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Context usage</div>
          {usage.map((u) => (
            <div key={u.model} className="text-xs">
              <div className="text-neutral-700 dark:text-neutral-300 truncate">{u.model}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-600 rounded overflow-hidden">
                  <div
                    className="h-full bg-neutral-500 dark:bg-neutral-400 rounded"
                    style={{ width: `${Math.min(100, u.percentage)}%` }}
                  />
                </div>
                <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {u.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="text-neutral-400 dark:text-neutral-500 mt-0.5">
                {formatTokens(u.tokensUsed)} / {formatTokens(u.maxTokens)} · {formatAgo(u.lastUsedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
