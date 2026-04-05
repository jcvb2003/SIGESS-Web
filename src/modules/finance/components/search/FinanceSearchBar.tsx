import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";

interface FinanceSearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export function FinanceSearchBar({ 
  value, 
  onChange,
  placeholder = "Buscar por nome, CPF ou matrícula..." 
}: FinanceSearchBarProps) {
  return (
    <div className="relative flex-1 group">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-9 text-sm bg-background border-border/50 focus-visible:ring-primary transition-all shadow-sm"
      />
    </div>
  );
}
