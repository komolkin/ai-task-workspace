import { useState } from 'react'

type Props = {
  onSubmit: (data: { title: string; description?: string }) => Promise<void>
}

export function CreateTaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    setLoading(true)
    try {
      await onSubmit({ title: t, description: description.trim() || undefined })
      setTitle('')
      setDescription('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full px-3 py-2 text-sm rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
        disabled={loading}
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-1.5 text-xs rounded bg-neutral-100 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 placeholder-neutral-400"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add task'}
      </button>
    </form>
  )
}
