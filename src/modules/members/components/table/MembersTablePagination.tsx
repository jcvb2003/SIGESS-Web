import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'

interface MembersTablePaginationProps {
  total: number
  page: number
  pageSize: number
  showingCount: number
  startIndex: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean
  onPageSizeChange: (value: string) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export function MembersTablePagination({
  total,
  page,
  pageSize,
  showingCount,
  startIndex,
  totalPages,
  isLoading,
  isFetching,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: MembersTablePaginationProps) {
  return (
    <div className="p-4 border-t border-border/50 bg-card rounded-b-xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs sm:text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          {total === 0 ? 'Nenhum sócio para exibir' : `Mostrando ${startIndex}–${showingCount} de ${total} sócios`}
        </span>
        <span className="hidden sm:inline text-border">•</span>
        <div className="flex items-center gap-1">
          <span>Por página:</span>
          <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-3">
        <span className="hidden sm:inline">Página {total === 0 ? 1 : page} de {totalPages}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={page === 1 || isLoading || isFetching}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={showingCount >= total || isLoading || isFetching}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
