import { useEffect, useState } from 'react'
import { KanbanBoard } from './components/KanbanBoard'
import { ModelUsagePanel } from './components/ModelUsagePanel'
import { SettingsModal } from './components/SettingsModal'
import { useTheme } from './hooks/useTheme'

function App() {
  useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Workspace
        </h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="p-1.5 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
        <KanbanBoard />
      </main>
      <ModelUsagePanel />
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}

export default App
