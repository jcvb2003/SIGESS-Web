import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface FinanceTablePaginationProps {
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

export function FinanceTablePagination({
  total,
  page,
  pageSize,
  onPageChange,
}: FinanceTablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <span className="text-xs text-muted-foreground">
        Mostrando {Math.min(pageSize, total)} de {total} sócios
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Anterior
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          const pageNum = i + 1;
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 w-8 text-xs",
                pageNum === page && "bg-emerald-600 hover:bg-emerald-700",
              )}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima →
        </Button>
      </div>
    </div>
  );
}
