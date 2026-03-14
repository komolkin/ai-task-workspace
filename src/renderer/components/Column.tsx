import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

type Props = {
  id: string
  title: string
  children: ReactNode
}

export function Column({ id, title, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}` })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-64 h-full max-h-full flex flex-col rounded-lg overflow-hidden
        bg-neutral-50 dark:bg-neutral-800/50
        ${isOver ? 'shadow-[inset_0_0_0_1px_#d4d4d4] dark:shadow-[inset_0_0_0_1px_#525252]' : ''}
      `}
    >
      <div className="flex-shrink-0 px-3 py-2">
        <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </h2>
      </div>
      <div className="flex-1 min-h-0 p-2 space-y-2 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
