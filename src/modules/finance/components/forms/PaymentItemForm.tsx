import { useMemo } from "react";
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
  Check,
  Plus,
  Trash2,
  UserPlus,
  ArrowRightLeft,
  History,
} from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { cn } from "@/shared/lib/utils";
import { PaymentTypeSelector, type SelectedCharge } from "../shared/PaymentTypeSelector";
import type {
  PaymentType,
  FinanceLancamento,
  PaymentSessionItem,
  ChargeType,
} from "../../types/finance.types";

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
export type { SelectedCharge };

interface PaymentItemFormProps {
  readonly currentYear: number;
  readonly anoBase: number;
  readonly valorAnuidade: number;
  readonly lancamentos: FinanceLancamento[];
  readonly isLoadingStatement: boolean;

  readonly paymentCategory: "anuidade" | "mensalidade";
  readonly onPaymentCategoryChange: (category: "anuidade" | "mensalidade") => void;

  readonly selectedYears: number[];
  readonly onToggleYear: (year: number) => void;

  readonly selectedMonths: number[];
  readonly onToggleMonth: (month: number) => void;

  readonly selectedYearForMensalidade: number;
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
  valorAnuidade,
  lancamentos,
  isLoadingStatement,
  paymentCategory,
  onPaymentCategoryChange,
  selectedYears,
  onToggleYear,
  selectedMonths,
  onToggleMonth,
  selectedYearForMensalidade,
  onYearForMensalidadeChange,
  extraFees,
  onAddExtraFee,
  onRemoveExtraFee,
  onFeeValueChange,
  selectedCharges,
  onToggleCharge,
  onChargeValueChange,
  onRemoveCharge,
  isHistoricMember,
  onToggleHistoricMember,
}: PaymentItemFormProps) {
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
    for (let y = currentYear; y >= anoBase; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear, anoBase]);

  const hasInicial = extraFees.some(f => f.tipo === "inicial");
  const hasTransferencia = extraFees.some(f => f.tipo === "transferencia");

  return (
    <div className="space-y-6 ring-0 border-none outline-none">
      {/* Category Selector */}
      <div className="flex border rounded-xl p-1 bg-slate-50/50">
        <button
          type="button"
          onClick={() => onPaymentCategoryChange("anuidade")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
            paymentCategory === "anuidade" 
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          ANUIDADE
        </button>
        <button
          type="button"
          onClick={() => onPaymentCategoryChange("mensalidade")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
            paymentCategory === "mensalidade" 
              ? "bg-white text-emerald-700 shadow-sm border border-slate-200" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          MENSALIDADE
        </button>
      </div>

      {/* Recurrent Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
            <Calendar className="h-3 w-3 text-emerald-500" />
            {paymentCategory === "anuidade" ? "SELECIONAR ANOS" : "SELECIONAR MESES"}
          </Label>
          <div className={paymentCategory === "mensalidade" ? undefined : "hidden"}>
            <Select
              value={selectedYearForMensalidade.toString()}
              onValueChange={(v) => onYearForMensalidadeChange(Number(v))}
            >
              <SelectTrigger className="h-7 w-20 text-[10px] font-bold border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={y.toString()} className="text-[10px] font-bold">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className={cn(
          "grid gap-2",
          paymentCategory === "anuidade" ? "grid-cols-3" : "grid-cols-4 sm:grid-cols-6"
        )}>
          {isLoadingStatement ? (
            ["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
              <div key={`skeleton-item-${id}`} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))
          ) : (
            <>
              {paymentCategory === "anuidade" && annuityYears.map((year) => {
                const isPaidFull = paidYears.has(year);
                const isMonthlyRegime = yearsWithAnyMonthlyPayment.has(year);
                const isSelected = selectedYears.includes(year);
                const isPaid = isPaidFull || isMonthlyRegime;

                let buttonClass = "bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30";
                
                if (isPaidFull) {
                  buttonClass = "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed";
                } else if (isMonthlyRegime) {
                  buttonClass = "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed";
                } else if (isSelected) {
                  buttonClass = "bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.02]";
                }

                let statusText = formatCurrency(valorAnuidade);
                if (isPaidFull) {
                  statusText = "JÁ PAGO";
                } else if (isMonthlyRegime) {
                  statusText = "REGIME MENSAL";
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
                    <span className={cn("text-[9px] font-bold tracking-tight", isSelected ? "text-emerald-100" : "text-slate-400")}>
                      {statusText}
                    </span>
                    {isPaid && <Check className="absolute top-1 right-1 h-3 w-3 text-emerald-500" />}
                  </button>
                );
              })}

              {paymentCategory === "mensalidade" && Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const paidInYear = paidMonthsByYear.get(selectedYearForMensalidade) || new Set();
                const isAnnuityPaid = paidYears.has(selectedYearForMensalidade);
                
                const isPaid = paidInYear.has(m) || isAnnuityPaid;
                const isSelected = selectedMonths.includes(m);

                let buttonClass = "bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30";
                if (isPaid) buttonClass = "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed";
                else if (isSelected) buttonClass = "bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.02]";

                return (
                  <button
                    key={`month-${m}`}
                    type="button"
                    disabled={isPaid}
                    onClick={() => onToggleMonth(m)}
                    className={cn("relative flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all p-1 font-medium", buttonClass)}
                  >
                    <span className="text-xs font-bold leading-tight uppercase tracking-tighter">{MONTH_LABELS[m]}</span>
                    {isPaid && <Check className="absolute top-1 right-1 h-3 w-3 text-emerald-500" />}
                    {isSelected && <span className="text-[8px] font-bold text-emerald-100 mt-0.5 animate-in zoom-in-50">OK</span>}
                    {isAnnuityPaid && <span className="absolute bottom-1 text-[7px] text-emerald-600 font-bold">ANUIDADE</span>}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Extra Fees (Inscrição) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
            <Plus className="h-3 w-3 text-emerald-500" />
            INSCRIÇÃO
          </Label>

          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
            <History className={cn("h-3 w-3", isHistoricMember ? "text-amber-500" : "text-slate-300")} />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Sócio Histórico</span>
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
                  "h-8 text-xs border-slate-200 gap-1.5 px-3 rounded-full font-bold transition-all",
                  isSelected 
                    ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700" 
                    : "bg-white hover:bg-slate-50 text-slate-600",
                  isPaid && "opacity-50 grayscale cursor-not-allowed bg-slate-100 border-slate-200"
                )}
              >
                {isPaid ? <Check className="h-3.5 w-3.5" /> : fee.icon}
                {fee.label}
                {isPaid && <span className="ml-1 text-[8px] opacity-70">JÁ PAGO</span>}
              </Button>
            );
          })}
        </div>

        {extraFees.length > 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 overflow-hidden divide-y divide-slate-100 ring-4 ring-slate-50">
            {extraFees.map((fee) => (
              <div key={fee.uid} className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-md border border-slate-100 shadow-sm">
                    {FEE_TYPES.find(f => f.value === fee.tipo)?.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {FEE_TYPES.find(f => f.value === fee.tipo)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="h-7 w-24 text-[11px] font-bold text-right pl-6 pr-2 border-slate-200 focus-visible:ring-emerald-500 bg-white"
                      value={fee.displayValue}
                      onChange={(e) => onFeeValueChange(fee.uid, e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveExtraFee(fee.uid)}
                    className="h-7 w-7 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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
