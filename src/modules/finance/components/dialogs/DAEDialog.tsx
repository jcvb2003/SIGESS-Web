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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { usePaymentSession } from "../../hooks/edit/usePaymentSession";
import { useMemberStatement } from "../../hooks/data/useMemberStatement";
import { useParametersData } from "@/modules/settings/hooks/useParametersData";
import { isMonthInDefeso } from "../../utils/defesoUtils";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatNumericInput } from "../shared/formatters";
import { generateUUID } from "@/shared/utils/uuid";
import { MemberFinancePreview } from "../shared/MemberFinancePreview";
import { PaymentMethodSelect } from "../shared/PaymentMethodSelect";
import {
  Loader2,
  Check,
  Calendar,
  X,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type {
  BoletoType,
  PaymentMethod,
  DAEItem,
  FinancialStatusType,
} from "../../types/finance.types";

const MONTH_LABELS = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface DAEDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly socioCpf: string | null;
  readonly socioName?: string;
  readonly status?: FinancialStatusType;
  readonly regime?: string;
}

export function DAEDialog({
  open,
  onOpenChange,
  socioCpf,
  socioName,
  status,
  regime,
}: DAEDialogProps) {
  const currentYear = new Date().getFullYear();
  const paymentMutation = usePaymentSession();
  const { daes: historyDaes } = useMemberStatement(open ? socioCpf : null);
  const { parameters } = useParametersData();

  const [valorTotal, setValorTotal] = useState(0);
  const [displayValue, setDisplayValue] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [boletoPago, setBoletoPago] = useState(false);
  const [dataPagamentoBoleto, setDataPagamentoBoleto] = useState(
    new Date().toLocaleDateString("sv"),
  );
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toLocaleDateString("sv"),
  );

  // Mapeia meses já pagos para o ano selecionado (ignora cancelados)
  const paidMonthsInYear = useMemo(() => {
    return new Set(
      historyDaes
        .filter(d => d.competencia_ano === selectedYear && d.status !== "cancelado")
        .map(d => d.competencia_mes)
    );
  }, [historyDaes, selectedYear]);

  const toggleMonth = (m: number) => {
    if (paidMonthsInYear.has(m) || isMonthInDefeso(m, selectedYear, parameters)) return;

    if (selectedMonths.includes(m)) {
      // Regressão: Desmarca o mês e todos os posteriores
      setSelectedMonths(prev => prev.filter(month => month < m));
    } else {
      // Progressão: Marca todos os meses pendentes até o mês clicado, respeitando o defeso
      const newSelection: number[] = [];
      for (let i = 1; i <= m; i++) {
        if (!paidMonthsInYear.has(i) && !isMonthInDefeso(i, selectedYear, parameters)) {
          newSelection.push(i);
        }
      }
      setSelectedMonths(newSelection);
    }
  };

  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replaceAll(/\D/g, "");
    const numericValue = Number(digits) / 100;
    setValorTotal(numericValue);
    setDisplayValue(formatNumericInput(numericValue));
  };

  const totalValue = valorTotal;
  const canConfirm = totalValue > 0 && selectedMonths.length > 0;

  const handleSubmit = async () => {
    if (!socioCpf) return;

    // Determina o tipo de boleto automaticamente
    let tipoBoleto: BoletoType = "agrupado";
    if (selectedMonths.length === 1) tipoBoleto = "unitario";
    if (selectedMonths.length === 12) tipoBoleto = "anual";

    // Distribui o valor total entre os meses selecionados
    const individualValue = Number((valorTotal / selectedMonths.length).toFixed(2));

    const sessaoId = generateUUID();
    const daeItems: DAEItem[] = selectedMonths.map((m) => ({
      tipo_boleto: tipoBoleto,
      competencia_ano: selectedYear,
      competencia_mes: m,
      valor: individualValue,
    }));

    await paymentMutation.mutateAsync({
      sessaoId,
      socioCpf,
      items: [],
      daes: daeItems,
      paymentMethod,
      paymentDate: dataRecebimento,
    });

    onOpenChange(false);
    setSelectedMonths([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl p-0 outline-none [&>button]:hidden overflow-hidden bg-white shadow-2xl rounded-2xl border-none">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <PlusCircle className="h-5 w-5" />
                <DialogTitle className="text-xl font-bold tracking-tight">
                  DAE (Documento de Arrecadação eSocial)
                </DialogTitle>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 border-slate-200"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 h-full max-h-[85vh]">
            <div className="space-y-6 py-6 font-primary">
              <MemberFinancePreview
                name={socioName}
                cpf={socioCpf ?? undefined}
                status={status}
                regime={regime}
              />

              {/* Seletor de Meses e Valor */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MESES</Label>
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(v) => {
                          setSelectedYear(Number(v));
                          setSelectedMonths([]);
                        }}
                      >
                        <SelectTrigger className="h-8 w-20 text-xs font-black border-slate-200 bg-white ring-offset-0 focus:ring-emerald-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                            <SelectItem key={y} value={y.toString()} className="text-xs font-bold">
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">VALOR DO REPASSE</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">R$</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={displayValue}
                          onChange={handleMoneyChange}
                          onFocus={(e) => e.target.select()}
                          className="h-8 pl-8 w-28 text-xs border-slate-200 focus:ring-emerald-500 font-bold bg-white rounded-md shadow-sm"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid de Meses */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const isPaid = paidMonthsInYear.has(m);
                    const isSelected = selectedMonths.includes(m);
                    const isDefeso = isMonthInDefeso(m, selectedYear, parameters);

                    const buttonStyles = cn(
                      "relative flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all p-1 font-medium select-none text-slate-600",
                      isPaid && "bg-slate-100 border-slate-100 opacity-60 cursor-not-allowed",
                      isDefeso && "bg-amber-50 border-amber-100 text-amber-900 cursor-not-allowed",
                      !isPaid && !isDefeso && isSelected && "bg-emerald-600 border-emerald-600 text-white shadow-md scale-[1.02]",
                      !isPaid && !isDefeso && !isSelected && "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"
                    );

                    return (
                      <button
                        key={`month-${m}`}
                        type="button"
                        disabled={isPaid || isDefeso}
                        onClick={() => toggleMonth(m)}
                        className={buttonStyles}
                        title={isDefeso ? "Período de Defeso - Emissão bloqueada" : undefined}
                      >
                        <span className="text-xs font-bold leading-tight uppercase tracking-tighter">
                          {MONTH_LABELS[m]}
                        </span>
                        {isPaid && (
                          <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100/80">
                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                          </div>
                        )}
                        {isDefeso && (
                          <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100/80">
                            <ShieldAlert className="h-2.5 w-2.5 text-amber-700" />
                          </div>
                        )}
                        {isSelected && !isDefeso && (
                          <span className="text-[8px] font-bold text-emerald-100 mt-0.5 animate-in zoom-in-50">OK</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pagamento */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <PaymentMethodSelect
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    label="Recebido via"
                  />
                  <div className="space-y-1.5 focus-within:ring-0">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Data Recebimento</Label>
                    <Input
                      type="date"
                      value={dataRecebimento}
                      onChange={(e) => setDataRecebimento(e.target.value)}
                      className="h-9 text-xs font-bold border-slate-200 bg-white shadow-sm rounded-md"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60 mt-2">
                  <Checkbox
                    id="boletoPago"
                    checked={boletoPago}
                    onCheckedChange={(checked) => setBoletoPago(!!checked)}
                    className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Label htmlFor="boletoPago" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    Marcar boleto DAE como pago.
                  </Label>
                </div>

                {boletoPago && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Pagamento no Banco</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="date"
                        value={dataPagamentoBoleto}
                        onChange={(e) => setDataPagamentoBoleto(e.target.value)}
                        className="h-9 pl-9 text-xs font-bold border-slate-200 bg-white focus-visible:ring-emerald-500 shadow-sm rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo e Ação */}
              <div className="pt-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm ring-4 ring-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold">TOTAL DO REPASSE ({selectedMonths.length} MÊS/MESES)</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(totalValue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold h-10 px-4 transition-colors rounded-lg"
                    >
                      CANCELAR
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={paymentMutation.isPending || !canConfirm}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-10 px-6 shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 rounded-lg"
                    >
                      {paymentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      CONFIRMAR REPASSE
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
