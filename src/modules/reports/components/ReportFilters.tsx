import { useTenantMode } from "@/shared/hooks/useTenantMode";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Filter, Search } from "lucide-react";

interface ReportFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedReport: string;
  onReportChange: (value: string) => void;
  carenciaFilter: string;
  onCarenciaChange: (value: string) => void;
  aposentadoriaFilter?: string;
  onAposentadoriaChange?: (value: string) => void;
}
export function ReportFilters({
  searchTerm,
  onSearchChange,
  selectedReport,
  onReportChange,
  carenciaFilter,
  onCarenciaChange,
  aposentadoriaFilter = "all",
  onAposentadoriaChange,
}: ReportFiltersProps) {
  const tenantMode = useTenantMode();

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
            {tenantMode !== "agricultura" && (
              <SelectItem value="requerimentos">Relatório de Requerimentos</SelectItem>
            )}
            {tenantMode !== "agricultura" && (
              <SelectItem value="nao_assinados">Sócios sem Requerimento</SelectItem>
            )}
            <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
          </SelectContent>
        </Select>

        {selectedReport === "aposentadoria" && (
          <div className="flex flex-col gap-2 pl-4 border-l border-border/40 ml-2 animate-in fade-in slide-in-from-right-4 duration-500">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Situação
            </Label>
            <RadioGroup
              value={aposentadoriaFilter}
              onValueChange={onAposentadoriaChange}
              className="flex items-center gap-4"
            >
              {[
                { value: "aposentados", label: "Aposentados" },
                { value: "aptos",       label: "Aptos" },
                { value: "em_breve",    label: "Em breve" },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-1.5">
                  <RadioGroupItem value={value} id={`rep-apos-${value}`} className="h-3.5 w-3.5" />
                  <Label htmlFor={`rep-apos-${value}`} className="font-normal cursor-pointer text-xs">{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {selectedReport === "nao_assinados" && (
          <div className="flex flex-col gap-2 pl-4 border-l border-border/40 ml-2 animate-in fade-in slide-in-from-right-4 duration-500">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Filtro de Carência
            </Label>
            <RadioGroup 
              value={carenciaFilter} 
              onValueChange={onCarenciaChange}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="all" id="rep-car-all" className="h-3.5 w-3.5" />
                <Label htmlFor="rep-car-all" className="font-normal cursor-pointer text-xs">Todos</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="com_carencia" id="rep-car-com" className="h-3.5 w-3.5" />
                <Label htmlFor="rep-car-com" className="font-normal cursor-pointer text-xs">Com carência</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <RadioGroupItem value="sem_carencia" id="rep-car-sem" className="h-3.5 w-3.5" />
                <Label htmlFor="rep-car-sem" className="font-normal cursor-pointer text-xs">Sem carência</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );
}
