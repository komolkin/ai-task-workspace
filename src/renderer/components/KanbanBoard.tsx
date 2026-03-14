import { useCallback, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useTasks } from '../hooks/useTasks'
import { useAutomations } from '../hooks/useAutomations'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { TaskCardInProgress } from './TaskCardInProgress'
import { CreateTaskForm } from './CreateTaskForm'
import { AutomationCard } from './AutomationCard'
import { AutomationModal } from './AutomationModal'
import { ReviewModal } from './ReviewModal'

const COLUMNS = [
  { id: 'automations', title: 'Automations' },
  { id: 'review', title: 'To-do' },
  { id: 'in_progress', title: 'In-progress' },
  { id: 'done', title: 'Done' },
] as const

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString()
}

export function KanbanBoard() {
  const { tasks, runStages, createTask, moveTask, retryTask } = useTasks()
  const { automations, create: createAutomation, refresh: refreshAutomations } = useAutomations()
  const [newAutomationOpen, setNewAutomationOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reviewFromProgress, setReviewFromProgress] = useState<{ taskId: string; columnId: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over?.id || String(active.id) === String(over.id)) return
      const taskId = String(active.id).startsWith('task-')
        ? String(active.id).replace('task-', '')
        : null
      if (!taskId) return
      const overStr = String(over.id)
      let targetColumnId: string | null = null
      if (overStr.startsWith('col-')) {
        targetColumnId = overStr.slice(4)
      } else if (overStr.startsWith('task-')) {
        const targetTaskId = overStr.replace('task-', '')
        const targetTask = tasks.find((t) => t.id === targetTaskId)
        if (targetTask) targetColumnId = targetTask.column
      }
      const validColumns = ['review', 'in_progress', 'done']
      if (targetColumnId && validColumns.includes(targetColumnId)) {
        await moveTask(taskId, targetColumnId)
      }
    },
    [moveTask, tasks]
  )

  const activeTask = activeId && activeId.startsWith('task-')
    ? tasks.find((t) => `task-${t.id}` === activeId)
    : null

  return (
    <div className="h-full min-h-0">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="flex gap-4 overflow-x-auto h-full min-h-0">
        {COLUMNS.map((col) => {
          const isAutomations = col.id === 'automations'
          const isReview = col.id === 'review'
          const isInProgress = col.id === 'in_progress'
          const colTasks = isAutomations
            ? []
            : tasks.filter((t) => t.column === col.id)
          return (
            <Column key={col.id} id={col.id} title={col.title}>
              {isAutomations && (
                <>
                  <button
                    type="button"
                    onClick={() => setNewAutomationOpen(true)}
                    className="w-full py-2 text-xs text-neutral-500 dark:text-neutral-400 rounded bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  >
                    + Add automation
                  </button>
                  {automations.map((a) => (
                    <AutomationCard key={a.id} automation={a} onUpdated={refreshAutomations} />
                  ))}
                </>
              )}
              {isReview && (
                <CreateTaskForm
                  onSubmit={async (data) => {
                    const task = await createTask(data)
                    if (task) {
                      await moveTask(task.id, 'review')
                      await moveTask(task.id, 'in_progress', { inPlace: true })
                    }
                  }}
                />
              )}
              {colTasks.map((task) =>
                runStages[task.id] ? (
                  <TaskCardInProgress
                    key={task.id}
                    task={task}
                    stage={runStages[task.id]}
                    onRetry={() => retryTask(task.id)}
                    onOpenReview={(taskId) => setReviewFromProgress({ taskId, columnId: col.id })}
                  />
                ) : (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columnId={col.id}
                  />
                )
              )}
            </Column>
          )
        })}
        </div>
        <DragOverlay dropAnimation={null}>
        {activeTask ? (
            <div
              className="
              rounded px-3 py-2 cursor-grabbing w-56
              bg-white dark:bg-neutral-800 shadow-lg
              opacity-95
            "
            >
            <div className="font-medium text-neutral-800 dark:text-neutral-100 text-sm">
              {activeTask.title}
            </div>
            {(() => {
              const sub = activeTask.nextStep ?? activeTask.description ?? ''
              return sub ? (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                  {sub.slice(0, 60)}{sub.length > 60 ? '…' : ''}
                </div>
              ) : null
            })()}
            <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {formatTime(activeTask.updatedAt)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
      {newAutomationOpen && (
        <AutomationModal
          onClose={() => setNewAutomationOpen(false)}
          onSaved={() => {
            refreshAutomations()
            setNewAutomationOpen(false)
          }}
        />
      )}
      {reviewFromProgress && (
        <ReviewModal
          taskId={reviewFromProgress.taskId}
          columnId={reviewFromProgress.columnId}
          onClose={() => setReviewFromProgress(null)}
          onUpdated={() => setReviewFromProgress(null)}
        />
      )}
      </DndContext>
    </div>
  )
}
