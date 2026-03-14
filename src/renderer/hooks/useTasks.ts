import { useState, useEffect, useCallback, useRef } from 'react'

export type Task = {
  id: string
  title: string
  description: string | null
  column: string
  status: string
  createdAt: number
  updatedAt: number
}

export type RunStage = { taskId: string; stage: string }

declare global {
  interface Window {
    electronAPI?: {
      tasksGetAll: () => Promise<Task[]>
      tasksCreate: (data: { title: string; description?: string }) => Promise<Task>
      tasksUpdateColumn: (taskId: string, column: string) => Promise<Task | null>
      taskMoveToInProgress: (taskId: string) => Promise<void>
      taskRetry: (taskId: string) => Promise<void>
      onTaskRunStage: (cb: (data: RunStage) => void) => () => void
      onTaskUpdated: (cb: (task: Task) => void) => () => void
    }
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [runStages, setRunStages] = useState<Record<string, string>>({})
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    const api = window.electronAPI
    if (!api) return
    try {
      const list = await api.tasksGetAll()
      if (mountedRef.current) setTasks(list)
    } catch (err) {
      if (mountedRef.current) console.error('tasksGetAll failed:', err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const electronAPI = window.electronAPI
    if (!electronAPI) return
    const unsubStage = electronAPI.onTaskRunStage(({ taskId, stage }) => {
      setRunStages((prev) => ({ ...prev, [taskId]: stage }))
    })
    const unsubTask = electronAPI.onTaskUpdated(() => {
      load()
    })
    return () => {
      unsubStage()
      unsubTask()
    }
  }, [load])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const createTask = useCallback(
    async (data: { title: string; description?: string }) => {
      const api = window.electronAPI
      if (!api) return
      try {
        await api.tasksCreate(data)
        await load()
      } catch (err) {
        console.error('tasksCreate failed:', err)
      }
    },
    [load]
  )

  const moveTask = useCallback(
    async (taskId: string, column: string) => {
      const api = window.electronAPI
      if (!api) return
      try {
        if (column === 'in_progress') {
          await api.taskMoveToInProgress(taskId)
        } else {
          await api.tasksUpdateColumn(taskId, column)
        }
        await load()
      } catch (err) {
        console.error('moveTask failed:', err)
      }
    },
    [load]
  )

  const retryTask = useCallback(
    async (taskId: string) => {
      const api = window.electronAPI
      if (!api) return
      try {
        await api.taskRetry(taskId)
        await load()
      } catch (err) {
        console.error('taskRetry failed:', err)
      }
    },
    [load]
  )

  return { tasks, runStages, createTask, moveTask, retryTask, refresh: load }
}
