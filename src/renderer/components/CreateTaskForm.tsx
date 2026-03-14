import { useState } from 'react'

type Props = {
  onSubmit: (data: { title: string; description?: string }) => Promise<void>
}

export function CreateTaskForm({ onSubmit }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const raw = input.trim()
    if (!raw) return
    const firstNewline = raw.indexOf('\n')
    const title = firstNewline === -1 ? raw : raw.slice(0, firstNewline).trim()
    const description = firstNewline === -1 ? undefined : raw.slice(firstNewline + 1).trim() || undefined
    if (!title) return
    setLoading(true)
    try {
      await onSubmit({ title, description })
      setInput('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSubmit(e as unknown as React.FormEvent)
          }
        }}
        placeholder="Describe task..."
        rows={2}
        className="w-full px-3 py-2 pr-20 pb-9 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 resize-none"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="absolute bottom-2 right-2 py-1.5 px-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Adding…' : 'Add task'}
      </button>
    </form>
  )
}
