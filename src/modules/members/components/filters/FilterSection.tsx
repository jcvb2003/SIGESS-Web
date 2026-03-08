import type { ReactNode } from 'react'

interface FilterSectionProps {
  title: string
  children: ReactNode
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase">{title}</span>
      {children}
    </div>
  )
}
