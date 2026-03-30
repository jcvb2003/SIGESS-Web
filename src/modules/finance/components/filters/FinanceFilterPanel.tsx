import { useState } from "react";
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";
import { FinanceFilterSection } from "./FinanceFilterSection";
import { FinanceFilterActions } from "./FinanceFilterActions";

interface FinanceFilterState {
  filterAnnuityOk: boolean;
  filterAnnuityOverdue: boolean;
  filterDAEPaid: boolean;
  filterDAEPending: boolean;
  filterContributionPending: boolean;
  filterGovRegistrationPending: boolean;
  filterReleased: boolean;
  filterExempt: boolean;
  year: number;
}

interface FinanceFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: FinanceFilterState;
  onApply: (filters: FinanceFilterState) => void;
  onClear: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export function FinanceFilterPanel({
  open,
  onOpenChange,
  currentFilters,
  onApply,
  onClear,
}: Readonly<FinanceFilterPanelProps>) {
  const [local, setLocal] = useState<FinanceFilterState>(currentFilters);

  const toggle = (key: keyof Omit<FinanceFilterState, "year">) => {
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApply = () => {
    onApply(local);
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  const yearOptions = Array.from(
    { length: CURRENT_YEAR - 2022 },
    (_, i) => CURRENT_YEAR - i,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto [&>button]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Filtros financeiros</SheetTitle>
              <SheetDescription>
                Refine a listagem por situação financeira, DAE e outros critérios.
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">
          {/* Ano de Referência */}
          <FinanceFilterSection title="Ano de Referência">
            <Select
              value={local.year.toString()}
              onValueChange={(v) =>
                setLocal((prev) => ({ ...prev, year: Number(v) }))
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FinanceFilterSection>

          {/* Anuidade */}
          <FinanceFilterSection title="Situação da Anuidade">
            <div className="space-y-3">
              <FilterCheckbox
                id="annuity-ok"
                label="Em dia"
                checked={local.filterAnnuityOk}
                onChange={() => toggle("filterAnnuityOk")}
              />
              <FilterCheckbox
                id="annuity-overdue"
                label="Inadimplente"
                checked={local.filterAnnuityOverdue}
                onChange={() => toggle("filterAnnuityOverdue")}
              />
            </div>
          </FinanceFilterSection>

          {/* DAE */}
          <FinanceFilterSection title="DAE (Repasse)">
            <div className="space-y-3">
              <FilterCheckbox
                id="dae-paid"
                label="DAE pago este ano"
                checked={local.filterDAEPaid}
                onChange={() => toggle("filterDAEPaid")}
              />
              <FilterCheckbox
                id="dae-pending"
                label="DAE pendente"
                checked={local.filterDAEPending}
                onChange={() => toggle("filterDAEPending")}
              />
            </div>
          </FinanceFilterSection>

          {/* Contribuições / Cadastros */}
          <FinanceFilterSection title="Contribuições e Cadastros">
            <div className="space-y-3">
              <FilterCheckbox
                id="contribution-pending"
                label="Contribuição pendente"
                checked={local.filterContributionPending}
                onChange={() => toggle("filterContributionPending")}
              />
              <FilterCheckbox
                id="gov-pending"
                label="Cadastro Gov. pendente"
                checked={local.filterGovRegistrationPending}
                onChange={() => toggle("filterGovRegistrationPending")}
              />
            </div>
          </FinanceFilterSection>

          {/* Especiais */}
          <FinanceFilterSection title="Situações Especiais">
            <div className="space-y-3">
              <FilterCheckbox
                id="released"
                label="Liberado (presidente)"
                checked={local.filterReleased}
                onChange={() => toggle("filterReleased")}
              />
              <FilterCheckbox
                id="exempt"
                label="Isento"
                checked={local.filterExempt}
                onChange={() => toggle("filterExempt")}
              />
            </div>
          </FinanceFilterSection>
        </div>

        <SheetFooter className="mt-6 mb-6">
          <FinanceFilterActions onClear={handleClear} onApply={handleApply} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Sub-componente local (checkbox com label) ──
function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: () => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
      />
      <Label
        htmlFor={id}
        className="text-sm font-medium cursor-pointer text-slate-700"
      >
        {label}
      </Label>
    </div>
  );
}
