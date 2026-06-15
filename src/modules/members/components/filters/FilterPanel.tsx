import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { FilterSection } from "./FilterSection";
import { FilterActions } from "./FilterActions";
import type {
  LocalityOption,
  StatusFilter,
  RgpStatusFilter,
} from "../../types/member.types";
import type { Portaria } from "@/modules/settings/types/settings.types";

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  localityFilter: string;
  onLocalityChange: (value: string) => void;
  birthMonthFilter: string;
  onBirthMonthChange: (value: string) => void;
  genderFilter: string;
  onGenderChange: (value: string) => void;
  rgpStatusFilter: RgpStatusFilter;
  onRgpStatusChange: (value: string) => void;
  portariaFilter: string;
  onPortariaChange: (value: string) => void;
  localities: LocalityOption[];
  portarias: Portaria[];
  onClear: () => void;
  onApply: () => void;
}

export function FilterPanel(props: Readonly<FilterPanelProps>) {
  const {
    open,
    onOpenChange,
    statusFilter,
    onStatusChange,
    localityFilter,
    onLocalityChange,
    birthMonthFilter,
    onBirthMonthChange,
    genderFilter,
    onGenderChange,
    rgpStatusFilter,
    onRgpStatusChange,
    portariaFilter,
    onPortariaChange,
    localities,
    portarias,
    onClear,
    onApply,
  } = props;

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de sócios</SheetTitle>
          <SheetDescription>
            Refine a listagem por situação, localidade e outros critérios.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <FilterSection title="Situação">
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusChange(value as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
                <SelectItem value="APOSENTADO">Aposentado</SelectItem>
                <SelectItem value="FALECIDO">Falecido</SelectItem>
                <SelectItem value="TRANSFERIDO">Transferido</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                <SelectItem value="SUSPENSO">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Localidade">
            <Select value={localityFilter} onValueChange={onLocalityChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {localities.map((locality) => (
                  <SelectItem
                    key={locality.code || locality.name}
                    value={locality.code || ""}
                  >
                    {locality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          {portarias.length >= 1 && (
            <FilterSection title="Portaria">
              <Select value={portariaFilter} onValueChange={onPortariaChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {portarias.map((p) => (
                    <SelectItem key={p.id} value={p.id!}>
                      {p.codigoPortaria} - {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          )}

          <FilterSection title="Mês de Aniversário">
            <Select
              value={birthMonthFilter || "all"}
              onValueChange={(value) =>
                onBirthMonthChange(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Gênero">
            <Select value={genderFilter} onValueChange={onGenderChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="RGP">
            <Select value={rgpStatusFilter} onValueChange={onRgpStatusChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_rgp">Ativo (Com RGP)</SelectItem>
                <SelectItem value="without_rgp">Sem RGP</SelectItem>
              </SelectContent>
            </Select>
          </FilterSection>
        </div>
        <SheetFooter className="mt-6 mb-6">
          <FilterActions onClear={onClear} onApply={onApply} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
