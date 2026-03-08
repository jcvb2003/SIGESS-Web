import { Search, Filter } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onOpenFilters: () => void
  placeholder?: string
}

export function SearchBar({ value, onChange, onOpenFilters, placeholder }: SearchBarProps) {
  return (
    <div className="p-4 border-b border-border/50 bg-muted/10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder ?? 'Buscar por nome, CPF ou matrícula...'}
          className="pl-9 h-11 bg-background w-full"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-11 px-4 bg-background"
          onClick={onOpenFilters}
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </Button>
      </div>
    </div>
  )
}
