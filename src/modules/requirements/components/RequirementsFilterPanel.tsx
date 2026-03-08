import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { RequirementStatus } from "../types/requirement.types";
import { BeneficioFilterType } from "../hooks/filters/useRequirementFilters";

interface RequirementsFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: RequirementStatus | 'all';
  onStatusChange: (status: RequirementStatus | 'all') => void;
  beneficioFilter: BeneficioFilterType;
  onBeneficioChange: (value: BeneficioFilterType) => void;
  yearFilter: number;
  onYearChange: (year: string) => void;
  onClear: () => void;
  onApply: () => void;
}

export function RequirementsFilterPanel({
  open,
  onOpenChange,
  statusFilter,
  onStatusChange,
  beneficioFilter,
  onBeneficioChange,
  yearFilter,
  onYearChange,
  onClear,
  onApply,
}: Readonly<RequirementsFilterPanelProps>) {
  const years = Array.from(
    { length: 5 }, 
    (_, i) => (new Date().getFullYear() - i).toString()
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filtros de Requerimentos</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Exercício */}
          <div className="space-y-2">
            <Label>Ano de Referência</Label>
            <Select value={yearFilter.toString()} onValueChange={onYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status MTE */}
          <div className="space-y-2">
            <Label>Status no MTE</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="assinado">Assinado</SelectItem>
                <SelectItem value="analise">Em Análise</SelectItem>
                <SelectItem value="recurso_acerto">Recurso / Acerto</SelectItem>
                <SelectItem value="deferido">Deferido</SelectItem>
                <SelectItem value="indeferido">Indeferido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Benefício */}
          <div className="space-y-3">
            <Label>Situação do Benefício</Label>
            <RadioGroup 
              value={beneficioFilter} 
              onValueChange={(val) => onBeneficioChange(val as BeneficioFilterType)}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="ben-all" />
                <Label htmlFor="ben-all" className="font-normal">Ambos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recebido" id="ben-pago" />
                <Label htmlFor="ben-pago" className="font-normal">Já Recebeu</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pendente" id="ben-pend" />
                <Label htmlFor="ben-pend" className="font-normal">Pendente / Aguardando</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={onApply} className="w-full">
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={onClear} className="w-full">
            Limpar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
