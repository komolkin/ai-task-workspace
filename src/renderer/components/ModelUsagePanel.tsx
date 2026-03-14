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

type Props = {
  variant?: 'float' | 'icon'
}

export function ModelUsagePanel({ variant = 'icon' }: Props) {
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

  const dropdown = open && (
    <div className="absolute top-full right-0 mt-2 w-72 rounded bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 p-3 space-y-2 z-50">
      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Context usage</div>
      {usage.length === 0 ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">No usage data yet.</p>
      ) : (
        usage.map((u) => (
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
        ))
      )}
    </div>
  )

  if (variant === 'float') {
    if (usage.length === 0) return null
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 rounded-lg px-4 py-2.5 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          Context usage
        </button>
        {dropdown}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Context usage"
        className="p-1.5 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      </button>
      {dropdown}
    </div>
  )
}
