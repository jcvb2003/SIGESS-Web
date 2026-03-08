import { Button } from "@/shared/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface RequirementsTablePaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading?: boolean;
  isFetching?: boolean;
  onPageSizeChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function RequirementsTablePagination({
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  isFetching,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: Readonly<RequirementsTablePaginationProps>) {
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/20">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Linhas por página:</span>
          <Select
            value={String(pageSize)}
            onValueChange={onPageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px] bg-background">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <span className="hidden sm:inline">
          Mostrando <span className="font-semibold text-foreground">{startIndex}-{endIndex}</span> de{" "}
          <span className="font-semibold text-foreground">{total}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {(isLoading || isFetching) && (
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
        )}
        
        <div className="flex items-center text-sm font-medium mr-4">
          Página {page} de {totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onPreviousPage}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onNextPage}
            disabled={page >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
