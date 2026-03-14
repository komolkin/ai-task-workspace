import { useState, useEffect } from 'react'
import type { Automation } from '../hooks/useAutomations'

const SCHEDULE_PRESETS: { label: string; value: string }[] = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at 9:00', value: '0 9 * * *' },
  { label: 'Daily at 18:00', value: '0 18 * * *' },
]

declare global {
  interface Window {
    electronAPI?: {
      titleGenerate: (text: string) => Promise<string>
      automationsCreate: (data: {
        title: string
        instruction: string
        schedule: string
        enabled: boolean
        outputMode: 'review' | 'in_progress'
      }) => Promise<Automation>
      automationsUpdate: (
        id: string,
        data: { title?: string; instruction?: string; schedule?: string; enabled?: boolean; outputMode?: 'review' | 'in_progress' }
      ) => Promise<Automation | null>
      automationsDelete: (id: string) => Promise<void>
    }
  }
}

type Props = {
  automation?: Automation | null
  onClose: () => void
  onSaved: () => void
}

function defaultSchedule() {
  return '0 9 * * *'
}

export function AutomationModal({ automation, onClose, onSaved }: Props) {
  const isNew = !automation
  const [describe, setDescribe] = useState(
    automation ? (automation.instruction || automation.title) : ''
  )
  const [schedule, setSchedule] = useState(automation?.schedule ?? defaultSchedule())
  const [enabled, setEnabled] = useState(automation?.enabled !== 0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (automation) {
      setDescribe(automation.instruction || automation.title)
      setSchedule(automation.schedule ?? defaultSchedule())
      setEnabled(automation.enabled !== 0)
    } else {
      setDescribe('')
      setSchedule(defaultSchedule())
      setEnabled(true)
    }
  }, [automation?.id])

  const handleSave = async () => {
    if (!window.electronAPI) return
    const raw = describe.trim()
    if (!raw) return
    setLoading(true)
    try {
      let title: string
      try {
        title =
          (await window.electronAPI.titleGenerate(raw))?.trim() ||
          raw.split(/\s+/).slice(0, 6).join(' ') ||
          'Untitled'
      } catch {
        title = raw.split(/\s+/).slice(0, 6).join(' ') || 'Untitled'
      }
      if (isNew) {
        await window.electronAPI.automationsCreate({
          title,
          instruction: raw,
          schedule,
          enabled,
          outputMode: 'review',
        })
      } else {
        await window.electronAPI.automationsUpdate(automation!.id, {
          title,
          instruction: raw,
          schedule,
          enabled,
          outputMode: 'review',
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('automation save failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!automation || !confirm('Delete this automation?')) return
    if (!window.electronAPI) return
    setLoading(true)
    try {
      await window.electronAPI.automationsDelete(automation.id)
      onSaved()
      onClose()
    } catch (err) {
      console.error('automationsDelete failed:', err)
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
        <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100 mb-4">
          {isNew ? 'New automation' : 'Edit automation'}
        </h3>
        <div className="space-y-4">
          <div>
            <textarea
              value={describe}
              onChange={(e) => setDescribe(e.target.value)}
              placeholder="Describe automation..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Schedule</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="select-with-arrow w-full pl-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100"
            >
              {SCHEDULE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="automation-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded bg-neutral-200 dark:bg-neutral-600"
            />
            <label htmlFor="automation-enabled" className="text-sm text-neutral-700 dark:text-neutral-300">
              Enabled
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-between">
          <div>
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
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
              disabled={loading || !describe.trim()}
              className="px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
