import { ipcRenderer, contextBridge } from 'electron'

const electronAPI = {
  // Theme
  onThemeUpdated: (cb: (theme: 'dark' | 'light') => void) => {
    const handler = (_: unknown, theme: 'dark' | 'light') => cb(theme)
    ipcRenderer.on('theme-updated', handler)
    return () => ipcRenderer.removeListener('theme-updated', handler)
  },

  // Tasks
  tasksGetAll: () => ipcRenderer.invoke('tasks:getAll'),
  tasksCreate: (data: { title: string; description?: string }) =>
    ipcRenderer.invoke('tasks:create', data),
  tasksUpdateColumn: (taskId: string, column: string) =>
    ipcRenderer.invoke('tasks:updateColumn', taskId, column),
  taskMoveToInProgress: (taskId: string, inPlace?: boolean) =>
    ipcRenderer.invoke('task:moveToInProgress', taskId, inPlace),
  taskRetry: (taskId: string) => ipcRenderer.invoke('task:retry', taskId),
  taskRemove: (taskId: string) => ipcRenderer.invoke('task:remove', taskId),
  onTaskRunStage: (cb: (data: { taskId: string; stage: string }) => void) => {
    const handler = (_: unknown, data: { taskId: string; stage: string }) => cb(data)
    ipcRenderer.on('taskRun:stage', handler)
    return () => ipcRenderer.removeListener('taskRun:stage', handler)
  },
  onTaskUpdated: (cb: (task: unknown) => void) => {
    const handler = (_: unknown, task: unknown) => cb(task)
    ipcRenderer.on('task:updated', handler)
    return () => ipcRenderer.removeListener('task:updated', handler)
  },

  // Review drafts
  reviewDraftsGetByTaskId: (taskId: string) =>
    ipcRenderer.invoke('reviewDrafts:getByTaskId', taskId),
  reviewDraftsUpdate: (draftId: string, data: { editedDetails?: string; checklist?: string[] }) =>
    ipcRenderer.invoke('reviewDrafts:update', draftId, data),
  reviewApprove: (taskId: string) => ipcRenderer.invoke('review:approve', taskId),
  reviewSendToTodo: (taskId: string) => ipcRenderer.invoke('review:sendToTodo', taskId),

  // Task runs (for regenerate)
  taskRunRegenerate: (taskId: string) => ipcRenderer.invoke('taskRun:regenerate', taskId),

  // Automations
  automationsList: () => ipcRenderer.invoke('automations:list'),
  automationsCreate: (data: {
    title: string
    instruction: string
    schedule: string
    enabled: boolean
    outputMode: 'review' | 'todo'
  }) => ipcRenderer.invoke('automations:create', data),
  automationsUpdate: (
    id: string,
    data: {
      title?: string
      instruction?: string
      schedule?: string
      enabled?: boolean
      outputMode?: 'review' | 'todo'
    }
  ) => ipcRenderer.invoke('automations:update', id, data),
  automationsDelete: (id: string) => ipcRenderer.invoke('automations:delete', id),

  // Model usage
  modelUsageGetAll: () => ipcRenderer.invoke('modelUsage:getAll'),
  onModelUsageUpdated: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('modelUsage:updated', handler)
    return () => ipcRenderer.removeListener('modelUsage:updated', handler)
  },

  // Settings (no API keys sent to renderer)
  settingsGet: () => ipcRenderer.invoke('settings:get'),
  settingsSet: (data: { provider?: string; defaultModel?: string; apiKey?: string }) =>
    ipcRenderer.invoke('settings:set', data),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
