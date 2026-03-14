import { useState, useEffect, useCallback } from 'react'

export type Automation = {
  id: string
  title: string
  instruction: string
  schedule: string
  enabled: number
  outputMode: string
  lastRunAt: number | null
  nextRunAt: number | null
  createdAt: number
  updatedAt: number
}

declare global {
  interface Window {
    electronAPI?: {
      automationsList: () => Promise<Automation[]>
      automationsCreate: (data: {
        title: string
        instruction: string
        schedule: string
        enabled: boolean
        outputMode: 'review' | 'todo'
      }) => Promise<Automation>
      automationsUpdate: (
        id: string,
        data: { title?: string; instruction?: string; schedule?: string; enabled?: boolean; outputMode?: 'review' | 'todo' }
      ) => Promise<Automation | null>
      automationsDelete: (id: string) => Promise<void>
    }
  }
}

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([])

  const load = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      const list = await window.electronAPI.automationsList()
      setAutomations(list)
    } catch (err) {
      console.error('automationsList failed:', err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = useCallback(
    async (data: Parameters<NonNullable<typeof window.electronAPI>['automationsCreate']>[0]) => {
      if (!window.electronAPI) return
      try {
        await window.electronAPI.automationsCreate(data)
        await load()
      } catch (err) {
        console.error('automationsCreate failed:', err)
      }
    },
    [load]
  )

  const update = useCallback(
    async (id: string, data: Parameters<NonNullable<typeof window.electronAPI>['automationsUpdate']>[1]) => {
      if (!window.electronAPI) return
      try {
        await window.electronAPI.automationsUpdate(id, data)
        await load()
      } catch (err) {
        console.error('automationsUpdate failed:', err)
      }
    },
    [load]
  )

  const remove = useCallback(
    async (id: string) => {
      if (!window.electronAPI) return
      try {
        await window.electronAPI.automationsDelete(id)
        await load()
      } catch (err) {
        console.error('automationsDelete failed:', err)
      }
    },
    [load]
  )

  return { automations, create, update, remove, refresh: load }
}
