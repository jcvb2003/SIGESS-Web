import { Search, Filter } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface DataTableSearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onOpenFilters?: () => void;
  readonly placeholder?: string;
  readonly contained?: boolean;
  readonly className?: string;
}

export function DataTableSearch({
  value,
  onChange,
  onOpenFilters,
  placeholder = "Buscar...",
  contained = true,
  className,
}: DataTableSearchProps) {
  const content = (
    <div className={cn("flex gap-2 md:gap-3 items-center flex-1", !contained && className)}>
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          placeholder={placeholder}
          className="pl-8 md:pl-9 h-9 md:h-10 text-xs md:text-sm bg-background w-full focus-visible:ring-primary transition-all shadow-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {onOpenFilters && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 md:h-10 md:w-auto md:px-4 bg-background shrink-0"
          onClick={onOpenFilters}
        >
          <Filter className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline font-bold uppercase text-[10px]">Filtros</span>
        </Button>
      )}
    </div>
  );

  if (contained) {
    return (
      <div className={cn("p-3 md:p-4 border-b border-border/50 bg-muted/10", className)}>
        {content}
      </div>
    );
  }

  return content;
}
