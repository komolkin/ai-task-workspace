import { useEffect } from 'react'

declare global {
  interface Window {
    electronAPI?: {
      onThemeUpdated: (cb: (theme: 'dark' | 'light') => void) => () => void
    }
  }
}

export function useTheme() {
  useEffect(() => {
    const api = window.electronAPI
    if (!api?.onThemeUpdated) return
    const unsub = api.onThemeUpdated((theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    })
    return unsub
  }, [])
}
