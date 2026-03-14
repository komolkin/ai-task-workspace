import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../hooks/useTasks'

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString()
}

type Props = {
  task: Task
  stage: string
  onRetry: () => void
  onOpenReview?: (taskId: string) => void
}

export function TaskCardInProgress({ task, stage, onRetry, onOpenReview }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined
  const isError = stage === 'Error'
  const isReady = stage === 'Ready for review'

  if (isReady && onOpenReview) {
    const description = task.nextStep ?? 'Ready for review'
    return (
      <div
        ref={setNodeRef}
        style={style}
        role="button"
        tabIndex={0}
        onClick={() => onOpenReview(task.id)}
        onKeyDown={(e) => e.key === 'Enter' && onOpenReview(task.id)}
        className="rounded px-3 py-2 cursor-pointer bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-600"
      >
        <div className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">
          {task.title}
        </div>
        {description && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
            {description.slice(0, 60)}{description.length > 60 ? '…' : ''}
          </div>
        )}
        <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {formatTime(task.createdAt)}
        </div>
      </div>
    )
  }

  const subtitleText = task.nextStep ?? task.description ?? ''
  const preview = subtitleText ? subtitleText.slice(0, 60) + (subtitleText.length > 60 ? '…' : '') : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        rounded px-3 py-2 cursor-grab
        bg-white dark:bg-neutral-800
        ${isDragging ? 'invisible' : ''}
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
      <div className={`flex items-center gap-2 ${preview ? 'mt-1' : 'mt-2'}`}>
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse"
          aria-hidden
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {isError ? (
            <>
              <span className="text-red-600 dark:text-red-400">Failed</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry()
                }}
                className="ml-2 underline cursor-pointer"
              >
                Retry
              </button>
            </>
          ) : (
            stage
          )}
        </span>
      </div>
    </div>
  )
}
