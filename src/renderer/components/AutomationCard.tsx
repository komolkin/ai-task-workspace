import type { Automation } from '../hooks/useAutomations'
import { useState } from 'react'
import { AutomationModal } from './AutomationModal'

type Props = {
  automation: Automation
  onUpdated: () => void
}

function formatNextRun(ts: number | null) {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  if (d.getTime() - now.getTime() < 60_000) return 'soon'
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AutomationCard({ automation, onUpdated }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left rounded px-3 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80"
      >
        <div className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">
          {automation.title}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {automation.enabled ? 'On' : 'Off'} · Next: {formatNextRun(automation.nextRunAt)}
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
