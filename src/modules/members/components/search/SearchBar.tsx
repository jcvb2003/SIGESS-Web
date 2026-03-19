import { Search, Filter } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters: () => void;
  placeholder?: string;
}
export function SearchBar({
  value,
  onChange,
  onOpenFilters,
  placeholder,
}: SearchBarProps) {
  return (
    <div className="p-3 md:p-4 border-b border-border/50 bg-muted/10 flex gap-2 md:gap-3 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder ?? "Buscar por nome, CPF ou matrícula..."}
          className="pl-8 md:pl-9 h-9 md:h-11 text-xs md:text-sm bg-background w-full"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 md:h-11 md:w-auto md:px-4 bg-background shrink-0"
        onClick={onOpenFilters}
      >
        <Filter className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
        <span className="hidden md:inline">Filtros</span>
      </Button>
    </div>
  );
}
