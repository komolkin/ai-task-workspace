import type { Automation } from '../hooks/useAutomations'
import { useState, useEffect } from 'react'
import { AutomationModal } from './AutomationModal'

type Props = {
  automation: Automation
  onUpdated: () => void
}

function formatNextRun(ts: number | null) {
  if (!ts) return '—'
  const diffMs = new Date(ts).getTime() - Date.now()
  if (diffMs <= 0) return 'now'
  const sec = Math.ceil(diffMs / 1000)
  if (sec < 60) return `in ${sec} sec`
  const min = Math.ceil(diffMs / 60_000)
  if (min < 60) return `in ${min} min`
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AutomationCard({ automation, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)

  // When next run is under 1 minute, re-render every second so "in 34 sec" ticks down
  useEffect(() => {
    if (!automation.enabled || !automation.nextRunAt) return
    const diffMs = new Date(automation.nextRunAt).getTime() - Date.now()
    if (diffMs < 60_000 && diffMs > 0) {
      const id = setInterval(() => setTick((n) => n + 1), 1000)
      return () => clearInterval(id)
    }
  }, [automation.enabled, automation.nextRunAt])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded px-3 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80"
      >
        <div className="flex items-center gap-2">
          <div className="font-medium text-neutral-800 dark:text-neutral-100 text-sm flex-1 min-w-0">
            {automation.title}
          </div>
          <span
            className={`flex-shrink-0 inline-block w-2 h-2 rounded-full ${
              automation.enabled
                ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
                : 'bg-neutral-400 dark:bg-neutral-500'
            }`}
            aria-hidden
          />
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {automation.enabled ? `On · Next: ${formatNextRun(automation.nextRunAt)}` : 'Off'}
        </div>
      </button>
      {open && (
        <AutomationModal
          automation={automation}
          onClose={() => setOpen(false)}
          onSaved={onUpdated}
        />
      )}
    </>
  )
}
