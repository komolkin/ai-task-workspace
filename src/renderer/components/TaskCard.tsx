import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../hooks/useTasks'
import { useState } from 'react'
import { ReviewModal } from './ReviewModal'

type Props = {
  task: Task
  columnId: string
  onProcess?: () => void
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString()
}

export function TaskCard({ task, columnId, onProcess }: Props) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const isReview = columnId === 'review'
  const isDone = columnId === 'done'
  const isInProgress = columnId === 'in_progress'
  const canOpen = isReview || isDone || isInProgress

  const subtitleText =
    (isReview || isInProgress) && task.nextStep
      ? task.nextStep
      : task.description ?? ''
  const preview = subtitleText
    ? subtitleText.slice(0, 60) + (subtitleText.length > 60 ? '…' : '')
    : ''

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={canOpen ? () => setReviewOpen(true) : undefined}
        className={`
          rounded px-3 py-2 cursor-grab active:cursor-grabbing
          bg-white dark:bg-neutral-800
          hover:bg-neutral-50 dark:hover:bg-neutral-700/80
          ${isDragging ? 'invisible' : ''}
          ${canOpen ? 'cursor-pointer' : ''}
        `}
      >
        <div className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">
          {task.title}
        </div>
        {preview && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
            {preview}
          </div>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {formatTime(task.updatedAt)}
            {isDone && ' · Done'}
          </span>
          {onProcess && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onProcess()
              }}
              className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
            >
              Process
            </button>
          )}
        </div>
      </div>
      {reviewOpen && (
        <ReviewModal
          taskId={task.id}
          columnId={columnId}
          onClose={() => setReviewOpen(false)}
          onUpdated={() => setReviewOpen(false)}
        />
      )}
    </>
  )
}
