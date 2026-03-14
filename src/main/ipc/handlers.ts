import { ipcMain, type BrowserWindow } from 'electron'
import { getDb } from '../db'
import * as taskService from '../services/taskService'
import * as automationService from '../services/automationService'
import * as reviewDraftService from '../services/reviewDraftService'
import * as modelUsageService from '../services/modelUsageService'
import * as settingsService from '../services/settingsService'
import { runPipelineForTask } from '../services/pipeline'

export function registerIpcHandlers(win: BrowserWindow) {
  const db = getDb()
  const send = (channel: string, ...args: unknown[]) => win.webContents.send(channel, ...args)
  automationService.initScheduler(db, (task) => {
  send('task:updated', task)
  send('modelUsage:updated')
})

  ipcMain.handle('tasks:getAll', () => taskService.getAll(db))
  ipcMain.handle('tasks:create', (_, data: { title: string; description?: string }) =>
    taskService.create(db, data)
  )
  ipcMain.handle('tasks:updateColumn', (_, taskId: string, column: string) =>
    taskService.updateColumn(db, taskId, column)
  )
  ipcMain.handle('task:remove', (_, taskId: string) => {
    taskService.remove(db, taskId)
    send('task:updated', null)
  })

  ipcMain.handle('task:moveToInProgress', async (_, taskId: string) => {
    await taskService.moveToInProgress(db, taskId, (stage) => send('taskRun:stage', { taskId, stage }), (task) => send('task:updated', task), () => send('modelUsage:updated'))
  })
  ipcMain.handle('task:retry', async (_, taskId: string) => {
    await taskService.retry(db, taskId, (stage) => send('taskRun:stage', { taskId, stage }), (task) => send('task:updated', task), () => send('modelUsage:updated'))
  })
  ipcMain.handle('taskRun:regenerate', async (_, taskId: string) => {
    await runPipelineForTask(db, taskId, (stage) => send('taskRun:stage', { taskId, stage }), (task) => send('task:updated', task), () => send('modelUsage:updated'))
  })

  ipcMain.handle('reviewDrafts:getByTaskId', (_, taskId: string) =>
    reviewDraftService.getByTaskId(db, taskId)
  )
  ipcMain.handle('reviewDrafts:update', (_, draftId: string, data: { editedDetails?: string; checklist?: string[] }) =>
    reviewDraftService.update(db, draftId, data)
  )
  ipcMain.handle('review:approve', (_, taskId: string) => {
    reviewDraftService.approve(db, taskId)
    const task = taskService.getById(db, taskId)
    if (task) send('task:updated', task)
  })
  ipcMain.handle('review:sendToTodo', (_, taskId: string) => {
    reviewDraftService.sendToTodo(db, taskId)
    const task = taskService.getById(db, taskId)
    if (task) send('task:updated', task)
  })

  ipcMain.handle('automations:list', () => automationService.list(db))
  ipcMain.handle('automations:create', (_, data: Parameters<typeof automationService.create>[1]) =>
    automationService.create(db, data)
  )
  ipcMain.handle('automations:update', (_, id: string, data: Parameters<typeof automationService.update>[2]) =>
    automationService.update(db, id, data)
  )
  ipcMain.handle('automations:delete', (_, id: string) =>
    automationService.remove(db, id)
  )

  ipcMain.handle('modelUsage:getAll', () => modelUsageService.getAll(db))
  ipcMain.handle('settings:get', () => settingsService.get(db))
  ipcMain.handle('settings:set', (_, data: { provider?: string; defaultModel?: string; apiKey?: string }) =>
    settingsService.set(db, data)
  )
}
