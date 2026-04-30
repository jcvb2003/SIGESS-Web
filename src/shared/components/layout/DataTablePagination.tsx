import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface DataTablePaginationProps {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly showingCount?: number;
  readonly startIndex?: number;
  readonly totalPages?: number;
  readonly isLoading?: boolean;
  readonly isFetching?: boolean;
  readonly entityName?: string;
  readonly showNumbers?: boolean;
  readonly onPageSizeChange: (value: string | number) => void;
  readonly onPageChange?: (page: number) => void;
  readonly onPreviousPage?: () => void;
  readonly onNextPage?: () => void;
}

export function DataTablePagination({
  total,
  page,
  pageSize,
  showingCount: propsShowingCount,
  startIndex: propsStartIndex,
  totalPages: propsTotalPages,
  isLoading = false,
  isFetching = false,
  entityName = "itens",
  showNumbers = false,
  onPageSizeChange,
  onPageChange,
  onPreviousPage,
  onNextPage,
}: Readonly<DataTablePaginationProps>) {
  const totalPages = propsTotalPages ?? Math.ceil(total / pageSize);
  const startIndex = propsStartIndex ?? (page - 1) * pageSize + 1;
  const showingCount = propsShowingCount ?? Math.min(page * pageSize, total);

  let startPage = Math.max(1, page - 2);
  if (startPage + 4 > totalPages) {
    startPage = Math.max(1, totalPages - 4);
  }

  const handlePrevious = () => {
    if (onPageChange) onPageChange(page - 1);
    else if (onPreviousPage) onPreviousPage();
  };

  const handleNext = () => {
    if (onPageChange) onPageChange(page + 1);
    else if (onNextPage) onNextPage();
  };

  return (
    <div className="p-4 border-t border-border/50 bg-card rounded-b-xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs sm:text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          {total === 0
            ? `Nenhum(a) ${entityName} para exibir`
            : `Mostrando ${startIndex}–${showingCount} de ${total} ${entityName}`}
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
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-3">
        <span className="hidden sm:inline">
          Página {total === 0 ? 1 : page} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={page === 1 || isLoading || isFetching}
          >
            Anterior
          </Button>

          {showNumbers && totalPages > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = startPage + i;
                const isActive = pageNum === page;
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 text-xs font-bold transition-all",
                      !isActive && "bg-background active:scale-95"
                    )}
                    onClick={() => onPageChange?.(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={showingCount >= total || isLoading || isFetching}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
