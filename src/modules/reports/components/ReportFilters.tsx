import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Filter, Search } from "lucide-react";
interface ReportFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedReport: string;
  onReportChange: (value: string) => void;
}
export function ReportFilters({
  searchTerm,
  onSearchChange,
  selectedReport,
  onReportChange,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 bg-muted/20 border-b border-border/40">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground hidden md:flex">
        <Filter className="h-4 w-4 text-primary/70" />
        Filtrar Resultados
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <div className="relative w-full sm:min-w-[320px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou protocolo..."
            className="pl-9 w-full bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={selectedReport} onValueChange={onReportChange}>
          <SelectTrigger className="w-full sm:w-[220px] bg-background shadow-sm">
            <SelectValue placeholder="Tipo de relatório" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requerimentos">Relatório de Requerimentos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
