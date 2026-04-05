import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

interface FinanceTablePaginationProps {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function FinanceTablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: FinanceTablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const showingCount = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="p-4 border-t border-border/50 bg-card rounded-b-xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs sm:text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          {total === 0
            ? "Nenhum registro para exibir"
            : `Mostrando ${startIndex}–${showingCount} de ${total} registros`}
        </span>
        <span className="hidden sm:inline text-border">•</span>
        <div className="flex items-center gap-1">
          <span>Por página:</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
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
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>

          {/* Numbered Buttons Restored */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
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
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={showingCount >= total}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
