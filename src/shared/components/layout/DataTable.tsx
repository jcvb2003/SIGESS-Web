import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { SearchX, AlertCircle, RefreshCcw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

export interface ColumnDef<T> {
  header: string | ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  skeletonVariant?: "text" | "circle" | "badge" | "button" | "full";
  skeletonWidth?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  skeletonCount?: number;
  variant?: "minimal" | "glass" | "card";
  // Slots para customização de estados
  customLoadingState?: ReactNode;
  customErrorState?: ReactNode;
  customEmptyState?: ReactNode;
}

/**
 * DataTable - Componente de listagem resiliente do SIGESS.
 * Refatorado para seguir princípios de composição e tipagem forte.
 */
export function DataTable<T>({
  columns,
  data,
  isLoading,
  isFetching,
  error,
  onRetry,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription = "Não conseguimos localizar nenhum dado com os critérios atuais.",
  onRowClick,
  className,
  rowClassName,
  skeletonCount = 5,
  variant = "minimal",
  customLoadingState,
  customErrorState,
  customEmptyState,
}: DataTableProps<T>) {
  const showLoading = isLoading || (isFetching && data.length === 0);

  const containerVariants = {
    minimal: "w-full border-b border-border/20",
    glass: "w-full overflow-hidden rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm",
    card: "w-full overflow-hidden rounded-xl border border-border bg-card shadow-md",
  };

  return (
    <div className={cn(containerVariants[variant], className)}>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent">
        <Table>
          <TableHeader>
            <TableRow className={cn(
              "border-b border-border/40",
              variant !== "minimal" && "bg-muted/30 hover:bg-muted/30"
            )}>
              {columns.map((column, index) => (
                <TableHead 
                  key={index} 
                  className={cn(
                    "h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80",
                    column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors",
                    column.headerClassName
                  )}
                  onClick={column.sortable ? column.onSort : undefined}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && (
                      <span className="ml-1.5 opacity-50">
                        {column.sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" />
                        ) : column.sortDirection === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoading ? (
              customLoadingState ?? (
                Array.from({ length: skeletonCount }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent border-b border-border/20 last:border-0">
                    {columns.map((column, j) => {
                      const widthClass = column.skeletonWidth || (j === 0 ? "w-2/3" : "w-full");
                      
                      return (
                        <TableCell key={j} className="h-16 px-4">
                          {column.skeletonVariant === "circle" ? (
                            <Skeleton className="h-10 w-10 rounded-full opacity-40" />
                          ) : column.skeletonVariant === "badge" ? (
                            <Skeleton className={cn("h-6 rounded-full opacity-30", widthClass)} />
                          ) : column.skeletonVariant === "button" ? (
                            <Skeleton className="h-8 w-8 rounded-md opacity-30" />
                          ) : (
                            <Skeleton className={cn("h-4 rounded-full opacity-40", widthClass)} />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )
            ) : error ? (
              customErrorState ?? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
                      <div className="rounded-2xl bg-destructive/10 p-4 ring-8 ring-destructive/5">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold tracking-tight text-destructive">Falha na conexão</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                          Não foi possível carregar os dados. Verifique sua internet e tente novamente.
                        </p>
                      </div>
                      {onRetry && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={onRetry}
                          className="mt-2 gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Tentar Novamente
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            ) : data.length === 0 ? (
              customEmptyState ?? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                      <div className="relative">
                        <div className="absolute inset-0 blur-2xl bg-primary/5 rounded-full" />
                        <div className="relative rounded-full bg-muted/30 p-6 ring-1 ring-border/50 shadow-inner">
                          <SearchX className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      </div>
                      <div className="space-y-1.5 px-4">
                        <h3 className="text-xl font-bold tracking-tight text-foreground/80">{emptyMessage}</h3>
                        <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                          {emptyDescription}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ) : (
              data.map((item, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-all duration-200 border-b border-border/20 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-primary/[0.03]",
                    typeof rowClassName === "function" ? rowClassName(item) : rowClassName
                  )}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell 
                      key={colIndex} 
                      className={cn(
                        "px-4 py-4 text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors",
                        column.className
                      )}
                    >
                      {column.cell 
                        ? column.cell(item) 
                        : column.accessorKey 
                          ? String(item[column.accessorKey] ?? "") 
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
