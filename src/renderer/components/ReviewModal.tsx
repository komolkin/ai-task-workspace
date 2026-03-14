import { useState, useEffect } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      reviewDraftsGetByTaskId: (taskId: string) => Promise<{
        id: string
        summary: string
        nextStep: string
        details: string
        checklist: string
        editedDetails: string | null
      } | null>
      reviewDraftsUpdate: (draftId: string, data: { editedDetails?: string; checklist?: string[] }) => Promise<unknown>
      reviewApprove: (taskId: string) => Promise<unknown>
      reviewSendToTodo: (taskId: string) => Promise<unknown>
      taskRunRegenerate: (taskId: string) => Promise<unknown>
      taskRemove: (taskId: string) => Promise<unknown>
    }
  }
}

type Props = {
  taskId: string
  columnId: string
  onClose: () => void
  onUpdated: () => void
}

export function ReviewModal({ taskId, columnId, onClose, onUpdated }: Props) {
  const isDone = columnId === 'done'
  const [draft, setDraft] = useState<{
    id: string
    summary: string
    nextStep: string
    details: string
    checklist: string
    editedDetails: string | null
  } | null>(null)
  const [draftFetched, setDraftFetched] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedDetails, setEditedDetails] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDraftFetched(false)
    window.electronAPI?.reviewDraftsGetByTaskId(taskId)
      .then((d) => {
        setDraft(d)
        setDraftFetched(true)
      })
      .catch((err) => {
        console.error('reviewDraftsGetByTaskId failed:', err)
        setDraftFetched(true)
      })
  }, [taskId])

  if (!draftFetched) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-neutral-500">Loading…</p>
        </div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-neutral-500">No review content yet.</p>
          <button type="button" onClick={onClose} className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 hover:underline">
            Close
          </button>
        </div>
      </div>
    )
  }

  const checklist = (() => {
    try {
      return JSON.parse(draft.checklist) as string[]
    } catch {
      return []
    }
  })()
  const detailsToShow = draft.editedDetails ?? draft.details

  const handleApprove = async () => {
    if (!window.electronAPI) return
    setLoading(true)
    try {
      await window.electronAPI.reviewApprove(taskId)
      onUpdated()
      onClose()
    } catch (err) {
      console.error('reviewApprove failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!window.electronAPI || !confirm('Remove this task? This cannot be undone.')) return
    setLoading(true)
    try {
      await window.electronAPI.taskRemove(taskId)
      onUpdated()
      onClose()
    } catch (err) {
      console.error('taskRemove failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (editedDetails === (draft.editedDetails ?? draft.details)) {
      setEditing(false)
      return
    }
    if (!window.electronAPI) return
    setLoading(true)
    try {
      await window.electronAPI.reviewDraftsUpdate(draft.id, { editedDetails })
      setDraft((p) => (p ? { ...p, editedDetails } : null))
      setEditing(false)
    } catch (err) {
      console.error('reviewDraftsUpdate failed:', err)
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
        className="bg-white dark:bg-neutral-800 rounded-lg max-w-xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex justify-between items-center">
          <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100">To-do</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            Close
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Summary</h4>
            <p className="text-sm text-neutral-800 dark:text-neutral-200">{draft.summary}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Next step</h4>
            <p className="text-sm text-neutral-800 dark:text-neutral-200">{draft.nextStep}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Details</h4>
            {editing ? (
              <>
                <textarea
                  value={editedDetails}
                  onChange={(e) => setEditedDetails(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 min-h-[120px]"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditedDetails(draft.editedDetails ?? draft.details)
                      setEditing(false)
                    }}
                    className="text-sm text-neutral-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{detailsToShow}</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditedDetails(detailsToShow)
                    setEditing(true)
                  }}
                  className="mt-1 text-xs text-neutral-500 hover:underline"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          {checklist.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Checklist</h4>
              <ul className="list-disc list-inside text-sm text-neutral-700 dark:text-neutral-300 space-y-0.5">
                {checklist.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {!isDone && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500"
            >
              Approve → Done
            </button>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
