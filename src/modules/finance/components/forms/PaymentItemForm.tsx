import { useMemo, useState } from "react";
import { EntityTabs } from "@/shared/components/layout/EntityTabs";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Calendar,
  CalendarClock,
  Check,
  Plus,
  Trash2,
  UserPlus,
  ArrowRightLeft,
  History,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/lib/utils";
import { PaymentTypeSelector, type SelectedCharge } from "../shared/PaymentTypeSelector";
import type {
  PaymentType,
  FinanceLancamento,
  PaymentSessionItem,
  ChargeType,
  SelectedAnnuity,
} from "../../types/finance.types";
import {
  getFirstRequiredMonthForYear,
  isMonthBeforeMembership,
} from "../../utils/membershipCompetency";

const MONTH_LABELS = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const FEE_TYPES: {
  value: PaymentType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "inicial", label: "Inicial", icon: <UserPlus className="h-3.5 w-3.5" /> },
  { value: "transferencia", label: "Transferência", icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
];

export interface ExtraFeeItem extends PaymentSessionItem {
  displayValue: string;
  uid: string;
}

// Re-export for PaymentSessionDialog
export type { SelectedCharge } from "../shared/PaymentTypeSelector";

interface PaymentItemFormProps {
  readonly currentYear: number;
  readonly anoBase: number;
  readonly lancamentos: FinanceLancamento[];
  readonly isLoadingStatement: boolean;

  readonly paymentCategory: "anuidade" | "mensalidade";
  readonly onPaymentCategoryChange: (category: "anuidade" | "mensalidade") => void;

  readonly selectedYears: SelectedAnnuity[];
  readonly onToggleYear: (year: number) => void;
  readonly onAnnuityValueChange: (year: number, rawValue: string) => void;

  readonly selectedMonths: number[];
  readonly onToggleMonth: (month: number) => void;

  readonly selectedYearForMensalidade: number;
  readonly memberAdmissionDate?: string | null;
  readonly allowRetroactiveMonthly: boolean;
  readonly onAllowRetroactiveMonthlyChange: (checked: boolean) => void;
  readonly canConfigureGracePeriod: boolean;
  readonly gracePeriodEnabled: boolean;
  readonly onGracePeriodToggle: () => void;
  readonly gracePeriodMonth: number;
  readonly onGracePeriodMonthChange: (month: number) => void;
  readonly gracePeriodYear: number;
  readonly onGracePeriodYearChange: (year: number) => void;
  readonly onYearForMensalidadeChange: (year: number) => void;

  readonly extraFees: ExtraFeeItem[];
  readonly onAddExtraFee: (type: PaymentType) => void;
  readonly onRemoveExtraFee: (uid: string) => void;
  readonly onFeeValueChange: (uid: string, value: string) => void;

  readonly selectedCharges: SelectedCharge[];
  readonly onToggleCharge: (chargeType: ChargeType) => void;
  readonly onChargeValueChange: (uid: string, rawValue: string) => void;
  readonly onRemoveCharge: (uid: string) => void;

  readonly isHistoricMember: boolean;
  readonly onToggleHistoricMember: (checked: boolean) => void;
}

export function PaymentItemForm({
  currentYear,
  anoBase,
  lancamentos,
  isLoadingStatement,
  paymentCategory,
  onPaymentCategoryChange,
  selectedYears,
  onToggleYear,
  selectedMonths,
  onToggleMonth,
  selectedYearForMensalidade,
  memberAdmissionDate,
  allowRetroactiveMonthly,
  onAllowRetroactiveMonthlyChange,
  canConfigureGracePeriod,
  gracePeriodEnabled,
  onGracePeriodToggle,
  gracePeriodMonth,
  onGracePeriodMonthChange,
  gracePeriodYear,
  onGracePeriodYearChange,
  onYearForMensalidadeChange,
  extraFees,
  onAddExtraFee,
  onRemoveExtraFee,
  onFeeValueChange,
  onAnnuityValueChange,
  selectedCharges,
  onToggleCharge,
  onChargeValueChange,
  onRemoveCharge,
  isHistoricMember,
  onToggleHistoricMember,
}: PaymentItemFormProps) {
  const [showAllYears, setShowAllYears] = useState(false);

  // Mapa de pagamentos já realizados (Memoizado para performance)
  const paidYears = useMemo(() => {
    return new Set(
      lancamentos
        .filter(l => l.tipo === "anuidade" && l.status === "pago")
        .map(l => l.competencia_ano)
        .filter(Boolean) as number[]
    );
  }, [lancamentos]);

  const paidFees = useMemo(() => {
    return new Set(
      lancamentos
        .filter(l => (l.tipo === "inicial" || l.tipo === "transferencia") && l.status === "pago")
        .map(l => l.tipo)
    );
  }, [lancamentos]);

  const yearsWithAnyMonthlyPayment = useMemo(() => {
    return new Set(
      lancamentos
        .filter(l => l.tipo === "mensalidade" && l.status === "pago")
        .map(l => l.competencia_ano)
        .filter(Boolean) as number[]
    );
  }, [lancamentos]);

  const paidMonthsByYear = useMemo(() => {
    const map = new Map<number, Set<number>>();
    lancamentos
      .filter(l => l.tipo === "mensalidade" && l.status === "pago")
      .forEach(l => {
        if (!l.competencia_ano || !l.competencia_mes) return;
        if (!map.has(l.competencia_ano)) map.set(l.competencia_ano, new Set());
        map.get(l.competencia_ano)?.add(l.competencia_mes);
      });
    return map;
  }, [lancamentos]);

  const annuityYears = useMemo(() => {
    const years = [];
    const startYear = Math.min(anoBase, currentYear - 2); // Garante visibilidade de anos recentes se anoBase for muito futuro
    // Permitir até 3 anos antes do anoBase e 1 ano no futuro
    for (let y = currentYear + 1; y >= startYear - 3; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear, anoBase]);

  const hasInicial = extraFees.some(f => f.tipo === "inicial");
  const hasTransferencia = extraFees.some(f => f.tipo === "transferencia");
  const firstRequiredMonth = getFirstRequiredMonthForYear(
    selectedYearForMensalidade,
    memberAdmissionDate,
  );
  const showRetroactiveControls =
    paymentCategory === "mensalidade" && firstRequiredMonth !== 1;
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 ring-0 border-none outline-none">
      {/* Category Selector */}
      {/* Category Selector with Year Selector integrated in standard EntityTabs pattern */}
      <EntityTabs 
        value={paymentCategory} 
        onValueChange={(val) => onPaymentCategoryChange(val as "anuidade" | "mensalidade")}
        className="w-full"
        rightActions={paymentCategory === "mensalidade" && (
          <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-lg border border-border/50">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Ano:</span>
            <Select
              value={selectedYearForMensalidade.toString()}
              onValueChange={(v) => onYearForMensalidadeChange(Number(v))}
            >
              <SelectTrigger className="h-7 w-20 text-[10px] font-bold border-none bg-transparent hover:bg-muted/50 transition-colors focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={y.toString()} className="text-[10px] font-bold">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        items={[
          {
            value: "anuidade",
            label: "Anuidade",
            content: null
          },
          {
            value: "mensalidade",
            label: "Mensalidade",
            content: null
          }
        ]}
      />

      {/* Recurrent Section Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
            <Calendar className="h-3 w-3 text-primary" />
            {paymentCategory === "anuidade" ? "SELECIONAR ANOS" : "SELECIONAR MESES"}
          </Label>
          {paymentCategory === "mensalidade" && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={gracePeriodEnabled ? "default" : "outline"}
                size="sm"
                onClick={onGracePeriodToggle}
                className={cn(
                  "h-8 px-3 text-[10px] font-black uppercase tracking-wider",
                  !canConfigureGracePeriod && "hidden",
                )}
              >
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Carência
              </Button>
              {canConfigureGracePeriod && showRetroactiveControls && (
                <Button
                  type="button"
                  variant={allowRetroactiveMonthly ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    onAllowRetroactiveMonthlyChange(!allowRetroactiveMonthly)
                  }
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-wider"
                >
                  Retroativo
                </Button>
              )}
            </div>
          )}
        </div>
        {paymentCategory === "mensalidade" &&
          canConfigureGracePeriod &&
          gracePeriodEnabled && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Carência até
              </Label>
              <Select
                value={gracePeriodMonth.toString()}
                onValueChange={(value) => onGracePeriodMonthChange(Number(value))}
              >
                <SelectTrigger className="h-9 text-xs font-bold bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month.toString()} className="text-[10px] font-bold">
                      {MONTH_LABELS[month]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Ano
              </Label>
              <Select
                value={gracePeriodYear.toString()}
                onValueChange={(value) => onGracePeriodYearChange(Number(value))}
              >
                <SelectTrigger className="h-9 text-xs font-bold bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-[10px] font-bold">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {canConfigureGracePeriod && showRetroactiveControls && !allowRetroactiveMonthly && firstRequiredMonth <= 12 && (
          <p className="text-[11px] text-muted-foreground">
            Meses anteriores a{" "}
            <span className="font-semibold uppercase">{MONTH_LABELS[firstRequiredMonth]}</span>{" "}
            foram bloqueados pela data de filiação.
          </p>
        )}
        {canConfigureGracePeriod && showRetroactiveControls && !allowRetroactiveMonthly && firstRequiredMonth > 12 && (
          <p className="text-[11px] text-muted-foreground">
            Esse ano é anterior à filiação do sócio. Ative o retroativo se quiser lançar cobranças manuais.
          </p>
        )}
        
        <div className={cn(
          "grid gap-2",
          paymentCategory === "anuidade" ? "grid-cols-3" : "grid-cols-4 sm:grid-cols-6"
        )}>
          {isLoadingStatement ? (
            ["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
              <div key={`skeleton-item-${id}`} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
            ))
          ) : (
            <>
              {paymentCategory === "anuidade" && (
                <>
                  {annuityYears.map((year) => {
                    const isPaidFull = paidYears.has(year);
                    const isMonthlyRegime = yearsWithAnyMonthlyPayment.has(year);
                    const isSelected = selectedYears.some(sy => sy.year === year);
                    const isPaid = isPaidFull || isMonthlyRegime;

                    // Mostra o ano se for o atual, se estiver expandido, ou se estiver selecionado
                    const isCurrentYear = year === currentYear;
                    const shouldShow = isCurrentYear || showAllYears || isSelected;

                    if (!shouldShow) return null;

                    let buttonClass = "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5";
                    
                    if (isPaidFull) {
                      buttonClass = "bg-muted/50 border-border/30 opacity-60 cursor-not-allowed";
                    } else if (isMonthlyRegime) {
                      buttonClass = "bg-muted/50 border-border/30 opacity-60 cursor-not-allowed";
                    } else if (isSelected) {
                      buttonClass = "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]";
                    }

                    return (
                      <button
                        key={`annuity-${year}`}
                        type="button"
                        disabled={isPaid}
                        onClick={() => onToggleYear(year)}
                        className={cn("relative flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all p-1 font-medium", buttonClass)}
                      >
                        <span className="text-sm font-bold">{year}</span>
                        <span className={cn("text-[9px] font-bold tracking-tight", isSelected ? "text-primary-foreground/90" : "text-muted-foreground/70")}>
                          {isPaidFull && "JÁ PAGO"}
                          {!isPaidFull && isMonthlyRegime && "REGIME MENSAL"}
                          {!isPaidFull && !isMonthlyRegime && "ANUIDADE"}
                        </span>
                        {isPaid && <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />}
                      </button>
                    );
                  })}

                  {!showAllYears && (
                    <button
                      key="show-more-years"
                      type="button"
                      onClick={() => setShowAllYears(true)}
                      className="flex flex-col items-center justify-center h-14 rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                    >
                      <Plus className="h-4 w-4 mb-0.5" />
                      <span className="text-[10px] font-bold uppercase">Mais</span>
                    </button>
                  )}
                </>
              )}

              {paymentCategory === "mensalidade" && Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const paidInYear = paidMonthsByYear.get(selectedYearForMensalidade) || new Set();
                const isAnnuityPaid = paidYears.has(selectedYearForMensalidade);
                const isBeforeAdmission =
                  !allowRetroactiveMonthly &&
                  isMonthBeforeMembership(
                    selectedYearForMensalidade,
                    m,
                    memberAdmissionDate,
                  );
                 
                const isPaid = paidInYear.has(m) || isAnnuityPaid;
                const isSelected = selectedMonths.includes(m);
                const isDisabled = isPaid || isBeforeAdmission;

                let buttonClass = "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5";
                if (isDisabled) buttonClass = "bg-muted/50 border-border/30 opacity-60 cursor-not-allowed";
                else if (isSelected) buttonClass = "bg-primary border-primary text-primary-foreground shadow-md scale-[1.02]";

                return (
                  <button
                    key={`month-${m}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onToggleMonth(m)}
                    className={cn("relative flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all p-1 font-medium", buttonClass)}
                  >
                    <span className="text-xs font-bold leading-tight uppercase tracking-tighter">{MONTH_LABELS[m]}</span>
                    {isPaid && <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />}
                    {isBeforeAdmission && (
                      <span className="mt-0.5 text-[8px] font-bold text-muted-foreground/80">
                        BLOQ.
                      </span>
                    )}
                    {isSelected && <span className="text-[8px] font-bold text-primary-foreground/90 mt-0.5 animate-in zoom-in-50">OK</span>}
                  </button>
                );
              })}
            </>
          )}
        </div>
        
        {/* Selected Annuities List with Editable Values */}
        {paymentCategory === "anuidade" && selectedYears.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 overflow-hidden divide-y divide-border/50 ring-4 ring-muted/20 mt-4">
            {selectedYears.map((ann) => (
              <div key={`edit-ann-${ann.year}`} className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                  <div className="bg-card p-1.5 rounded-md border border-border/50 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-foreground/80">
                    Anuidade {ann.year}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/60 pointer-events-none">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="h-7 w-24 text-[11px] font-bold text-right pl-6 pr-2 border-border focus-visible:ring-ring bg-card"
                      value={ann.displayValue}
                      onChange={(e) => onAnnuityValueChange(ann.year, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => onToggleYear(ann.year)}
                          className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-red-600 dark:hover:bg-red-900/50 hover:text-white dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-800/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5}>Remover</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Extra Fees (Inscrição) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
            <Plus className="h-3 w-3 text-primary" />
            INSCRIÇÃO
          </Label>

          <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full border border-border/50">
            <History className={cn("h-3 w-3", isHistoricMember ? "text-amber-500" : "text-muted-foreground/40")} />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Sócio Histórico</span>
            <Switch 
              checked={isHistoricMember} 
              onCheckedChange={onToggleHistoricMember}
              className="scale-75 h-4 w-7 data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {FEE_TYPES.map(fee => {
            const isSelected = extraFees.some(f => f.tipo === fee.value);
            const isPaid = paidFees.has(fee.value);
            const isDisabledByOther = 
              (fee.value === "inicial" && hasTransferencia) || 
              (fee.value === "transferencia" && hasInicial);
            
            const isDisabled = isPaid || isDisabledByOther || isHistoricMember;

            return (
              <Button
                key={fee.value}
                type="button"
                variant="outline"
                size="sm"
                disabled={isDisabled}
                onClick={() => onAddExtraFee(fee.value)}
                className={cn(
                  "h-9 text-[11px] border-border gap-2 px-4 rounded-xl font-bold transition-all shadow-sm",
                  isSelected 
                    ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 shadow-primary/10" 
                    : "bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                  isPaid && "opacity-50 grayscale cursor-not-allowed bg-muted/30 border-border"
                )}
              >
                {isPaid ? <Check className="h-3.5 w-3.5 text-primary" /> : fee.icon}
                {fee.label}
                {isPaid && <span className="ml-1 text-[8px] opacity-70">JÁ PAGO</span>}
              </Button>
            );
          })}
        </div>

        {extraFees.length > 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 overflow-hidden divide-y divide-border/50 ring-4 ring-muted/20">
            {extraFees.map((fee) => (
              <div key={fee.uid} className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                  <div className="bg-card p-1.5 rounded-md border border-border/50 shadow-sm">
                    {FEE_TYPES.find(f => f.value === fee.tipo)?.icon}
                  </div>
                  <span className="text-xs font-bold text-foreground/80">
                    {FEE_TYPES.find(f => f.value === fee.tipo)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/60 pointer-events-none">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="h-7 w-24 text-[11px] font-bold text-right pl-6 pr-2 border-border focus-visible:ring-ring bg-card"
                      value={fee.displayValue}
                      onChange={(e) => onFeeValueChange(fee.uid, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => onRemoveExtraFee(fee.uid)}
                          className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-red-600 dark:hover:bg-red-900/50 hover:text-white dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-800/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5}>Remover</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charge Types (Contribuições e Cadastros Governamentais) */}
      <PaymentTypeSelector
        selected={selectedCharges}
        onToggle={onToggleCharge}
        onValueChange={onChargeValueChange}
        onRemove={onRemoveCharge}
      />
    </div>
  );
}
