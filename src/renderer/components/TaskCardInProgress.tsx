import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../hooks/useTasks'

type Props = {
  task: Task
  stage: string
  onRetry: () => void
}

export function TaskCardInProgress({ task, stage, onRetry }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  })
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined
  const isError = stage === 'Error'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        rounded px-3 py-2 cursor-grab
        bg-white dark:bg-neutral-800
        ${isDragging ? 'opacity-40' : ''}
      `}
    >
      <div className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">
        {task.title}
      </div>
      <div className="mt-2 flex items-center gap-2">
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
                className="ml-2 underline"
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
