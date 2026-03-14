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
          AI Task Workspace
        </h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Settings
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
