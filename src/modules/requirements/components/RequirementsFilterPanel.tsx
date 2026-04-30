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
import { BeneficioFilterType, CarenciaFilterType } from "../hooks/filters/useRequirementFilters";
import { useParametersData } from "@/modules/settings/hooks/useParametersData";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RequirementsFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: RequirementStatus | 'all';
  onStatusChange: (status: RequirementStatus | 'all') => void;
  beneficioFilter: BeneficioFilterType;
  onBeneficioChange: (value: BeneficioFilterType) => void;
  yearFilter: number;
  onYearChange: (year: string) => void;
  carenciaFilter: CarenciaFilterType;
  onCarenciaChange: (value: string) => void;
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
  carenciaFilter,
  onCarenciaChange,
  onClear,
  onApply,
}: Readonly<RequirementsFilterPanelProps>) {
  const years = Array.from(
    { length: 5 }, 
    (_, i) => (new Date().getFullYear() - i).toString()
  );
  
  const { parameters } = useParametersData();

  const getFormattedDefeso = () => {
    const rawDate = parameters?.defeso1Start;
    if (!rawDate) return "(data configurada)";
    
    const parsedDate = parseISO(rawDate);
    if (isValid(parsedDate)) {
      return `(${format(parsedDate, "dd/MMM", { locale: ptBR })})`;
    }
    return `(${rawDate})`;
  };

  const defesoDateText = getFormattedDefeso();

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

          {/* Carência */}
          <div className="space-y-3 pt-2">
            <Label>Filtrar por Carência</Label>
            <RadioGroup 
              value={carenciaFilter} 
              onValueChange={onCarenciaChange}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="car-all" />
                <Label htmlFor="car-all" className="font-normal cursor-pointer">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="com_carencia" id="car-com" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="car-com" className="font-normal cursor-pointer">Possui carência</Label>
                  <p className="text-[10px] text-muted-foreground">
                    RGP ativo há pelo menos 1 ano antes do defeso {defesoDateText}.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sem_carencia" id="car-sem" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="car-sem" className="font-normal cursor-pointer">Sem carência</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Não atingiu o tempo mínimo de RGP.
                  </p>
                </div>
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
