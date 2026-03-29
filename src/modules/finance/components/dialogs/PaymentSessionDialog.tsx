import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { usePaymentSession } from "../../hooks/edit/usePaymentSession";
import { useFinanceSettings } from "../../hooks/data/useFinanceSettings";
import { useMemberStatement } from "../../hooks/data/useMemberStatement";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { 
  Loader2, 
  Check, 
  Calendar, 
  UserPlus, 
  ArrowRightLeft, 
  Star,
  Plus,
  Trash2,
  Wallet,
  Globe
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { 
  PaymentSessionItem, 
  PaymentType, 
  PaymentMethod 
} from "../../types/finance.types";

const FEE_TYPES: {
  value: PaymentType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "inscricao", label: "Inscrição", icon: <UserPlus className="h-3.5 w-3.5" /> },
  { value: "transferencia", label: "Transferência", icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
  { value: "contribuicao", label: "Contribuição", icon: <Star className="h-3.5 w-3.5" /> },
  { value: "cadastro_governamental", label: "Cadastro", icon: <Globe className="h-3.5 w-3.5" /> },
  { value: "outros", label: "Outros", icon: <Plus className="h-3.5 w-3.5" /> },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro (espécie)" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência bancária" },
  { value: "boleto", label: "Boleto bancário" },
  { value: "cartao", label: "Cartão débito/crédito" },
];

interface PaymentSessionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly socioCpf: string | null;
  readonly socioName?: string;
}

/**
 * Utilitário para formatar número enquanto digita (Nubank Style).
 * Exemplo: 1 -> 0,01 | 12 -> 0,12 | 125 -> 1,25
 */
const formatMoneyNubank = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function PaymentSessionDialog({
  open,
  onOpenChange,
  socioCpf,
  socioName,
}: PaymentSessionDialogProps) {
  const { settings } = useFinanceSettings();
  const { lancamentos, isLoading: isLoadingStatement } = useMemberStatement(open ? socioCpf : null);
  const paymentMutation = usePaymentSession();

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  interface ExtraFeeItem extends PaymentSessionItem {
    displayValue: string;
    uid: string;
  }

  const [extraFees, setExtraFees] = useState<ExtraFeeItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleDateString("sv"), // YYYY-MM-DD local
  );

  const currentYear = new Date().getFullYear();
  const anoBase = settings?.ano_base_cobranca ?? 2024;
  const valorAnuidade = settings?.valor_anuidade ?? 0;

  // Mapa de anos já pagos
  const paidYears = useMemo(() => {
    return new Set(
      lancamentos
        .filter(l => l.tipo === "anuidade" && l.status === "pago")
        .map(l => l.competencia_ano)
        .filter(Boolean) as number[]
    );
  }, [lancamentos]);

  // Lista de anos disponíveis para cobrança
  const annuityYears = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= anoBase; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear, anoBase]);

  const toggleYear = (year: number) => {
    if (paidYears.has(year)) return;
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year].sort((a, b) => b - a),
    );
  };

  const addExtraFee = (type: PaymentType) => {
    let valor = 0;
    if (type === "inscricao") valor = settings?.valor_inscricao ?? 0;
    if (type === "transferencia") valor = settings?.valor_transferencia ?? 0;

    setExtraFees(prev => {
      let filtered = [...prev];
      // Inscrição e Transferência são excludentes
      if (type === "inscricao") {
        filtered = filtered.filter(f => f.tipo !== "transferencia");
      } else if (type === "transferencia") {
        filtered = filtered.filter(f => f.tipo !== "inscricao");
      }

      return [...filtered, { 
        tipo: type, 
        valor, 
        displayValue: formatMoneyNubank(valor),
        uid: crypto.randomUUID()
      }];
    });
  };

  const removeExtraFee = (uid: string) => {
    setExtraFees(prev => prev.filter((item) => item.uid !== uid));
  };

  const handleFeeValueChange = (uid: string, rawValue: string) => {
    const digits = rawValue.replaceAll(/\D/g, "");
    const numericValue = Number(digits) / 100;
    
    setExtraFees(prev => prev.map((item) => 
      item.uid === uid 
        ? { ...item, valor: numericValue, displayValue: formatMoneyNubank(numericValue) }
        : item
    ));
  };

  const totalAnnuities = (selectedYears.length || 0) * (valorAnuidade || 0);
  const totalFees = extraFees.reduce((sum, item) => sum + (item.valor || 0), 0);
  const totalValue = totalAnnuities + totalFees;
  const canConfirm = totalValue > 0 && (selectedYears.length > 0 || extraFees.length > 0);

  const handleSubmit = async () => {
    if (!socioCpf) return;

    const sessaoId = crypto.randomUUID();
    const items: PaymentSessionItem[] = [
      ...selectedYears.map(year => ({
        tipo: "anuidade" as const,
        competencia_ano: year,
        valor: valorAnuidade,
      })),
      ...extraFees.map(({ tipo, valor, competencia_ano }) => ({ tipo, valor, competencia_ano }))
    ];

    await paymentMutation.mutateAsync({
      sessaoId,
      socioCpf,
      items,
      paymentMethod,
      paymentDate,
    });

    onOpenChange(false);
    setSelectedYears([]);
    setExtraFees([]);
  };

  const initials = useMemo(() => {
    return socioName
      ?.split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [socioName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl p-0 outline-none overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Wallet className="h-5 w-5" />
            <DialogTitle className="text-xl">Novo Lançamento Financeiro</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Registro de anuidades, taxas e contribuições
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 h-full max-h-[85vh]">
          <div className="space-y-6 py-6 border-none">
             {/* Member Preview */}
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-sm ring-2 ring-emerald-100 ring-offset-1">
                {initials ?? "?"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{socioName}</p>
                <p className="text-xs text-emerald-600 mt-0.5 font-medium">CPF: {socioCpf}</p>
              </div>
            </div>

            {/* Annuity Grid */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="h-3 w-3 text-emerald-500" />
                ANUIDADES PENDENTES (ANO BASE {anoBase})
              </Label>
              
              <div className="grid grid-cols-3 gap-2">
                {isLoadingStatement ? (
                  ["sk-1", "sk-2", "sk-3"].map((id) => (
                    <div key={id} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
                  ))
                ) : (
                  annuityYears.map((year) => {
                    const isPaid = paidYears.has(year);
                    const isSelected = selectedYears.includes(year);
                    
                    // Lógica extraída para evitar ternários aninhados (SonarQube)
                    let buttonStateClass = "bg-white border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30";
                    if (isPaid) {
                      buttonStateClass = "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed";
                    } else if (isSelected) {
                      buttonStateClass = "bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.02]";
                    }

                    const labelColorClass = isSelected ? "text-emerald-100" : "text-slate-400";
                    
                    return (
                      <button
                        key={`annuity-${year}`}
                        type="button"
                        disabled={isPaid}
                        onClick={() => toggleYear(year)}
                        className={cn("relative flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all p-1 font-medium", buttonStateClass)}
                      >
                        <span className="text-sm font-bold">{year}</span>
                        <span className={cn("text-[9px] font-bold tracking-tight", labelColorClass)}>
                          {isPaid ? "JÁ PAGO" : formatCurrency(valorAnuidade)}
                        </span>
                        {isPaid && <Check className="absolute top-1 right-1 h-3 w-3 text-emerald-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Extra Fees */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Plus className="h-3 w-3 text-emerald-500" />
                TAXAS E OUTROS
              </Label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {FEE_TYPES.map(fee => (
                  <Button
                    key={fee.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExtraFee(fee.value)}
                    className="h-8 text-xs border-slate-200 hover:bg-slate-50 gap-1.5 px-3 rounded-full font-semibold text-slate-600"
                  >
                    {fee.icon}
                    {fee.label}
                  </Button>
                ))}
              </div>

              {extraFees.length > 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 overflow-hidden divide-y divide-slate-100">
                  {extraFees.map((fee: ExtraFeeItem) => (
                    <div key={fee.uid} className="flex items-center justify-between p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-1.5 rounded-md border border-slate-100">
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
                            onChange={(e) => handleFeeValueChange(fee.uid, e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeExtraFee(fee.uid)}
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

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger className="h-10 text-xs border-slate-200 focus:ring-emerald-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data do Recebimento</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10 text-xs border-slate-200 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Action Area (Inline Content) */}
            <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">TOTAL A RECEBER</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold h-10 px-4"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={paymentMutation.isPending || !canConfirm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-10 px-6 shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
                  >
                    {paymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    CONFIRMAR REGISTRO
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
