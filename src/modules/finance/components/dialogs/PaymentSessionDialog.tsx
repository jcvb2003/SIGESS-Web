import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { usePaymentSession } from "../../hooks/edit/usePaymentSession";
import { useFinanceSettings } from "../../hooks/data/useFinanceSettings";
import { useMemberStatement } from "../../hooks/data/useMemberStatement";
import { memberFinanceConfigService } from "../../services/memberFinanceConfigService";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatNumericInput } from "../shared/formatters";
import { MemberFinancePreview } from "../shared/MemberFinancePreview";
import { PaymentMethodSelect } from "../shared/PaymentMethodSelect";
import { PaymentItemForm, type ExtraFeeItem, type SelectedCharge } from "../forms/PaymentItemForm";
import {
  Loader2,
  Check,
  Wallet,
  X,
} from "lucide-react";
import type {
  PaymentSessionItem,
  PaymentType,
  PaymentMethod,
  FinancialStatusType,
  ChargeType,
  FinanceLancamento,
} from "../../types/finance.types";

interface PaymentSessionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly socioCpf: string | null;
  readonly socioName?: string;
  readonly status?: FinancialStatusType;
  readonly regime?: string;
}

export function PaymentSessionDialog({
  open,
  onOpenChange,
  socioCpf,
  socioName,
  status,
  regime,
}: PaymentSessionDialogProps) {
  const { settings } = useFinanceSettings();
  const { lancamentos, isLoading: isLoadingStatement } = useMemberStatement(open ? socioCpf : null);
  const paymentMutation = usePaymentSession();

  const [paymentCategory, setPaymentCategory] = useState<"anuidade" | "mensalidade">("anuidade");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [selectedYearForMensalidade, setSelectedYearForMensalidade] = useState(currentYear);
  const [extraFees, setExtraFees] = useState<ExtraFeeItem[]>([]);
  const [selectedCharges, setSelectedCharges] = useState<SelectedCharge[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleDateString("sv"), // YYYY-MM-DD local
  );
  const [isHistoricMember, setIsHistoricMember] = useState(false);

  const anoBase = settings?.ano_base_cobranca ?? 2024;
  const valorAnuidade = settings?.valor_anuidade ?? 0;
  const valorMensalidade = settings?.valor_mensalidade ?? (valorAnuidade / 12);

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year].sort((a, b) => b - a),
    );
  };

  useEffect(() => {
    async function loadConfig() {
      if (open && socioCpf) {
        try {
          const config = await memberFinanceConfigService.getConfig(socioCpf);
          // @ts-expect-error - campo recém adicionado no banco
          setIsHistoricMember(config?.socio_historico ?? false);
        } catch (error) {
          console.error("Erro ao carregar configuração financeira:", error);
        }
      }
    }
    loadConfig();
  }, [open, socioCpf]);

  const toggleMonth = (m: number) => {
    const paidMonthsByYear = new Map<number, Set<number>>();
    lancamentos
      .filter((l: FinanceLancamento) => l.tipo === "mensalidade" && l.status === "pago")
      .forEach((l: FinanceLancamento) => {
        if (!l.competencia_ano || !l.competencia_mes) return;
        if (!paidMonthsByYear.has(l.competencia_ano)) paidMonthsByYear.set(l.competencia_ano, new Set());
        paidMonthsByYear.get(l.competencia_ano)?.add(l.competencia_mes);
      });

    const paidInYear = paidMonthsByYear.get(selectedYearForMensalidade) || new Set();
    if (paidInYear.has(m)) return;

    if (selectedMonths.includes(m)) {
      setSelectedMonths(prev => prev.filter(month => month < m));
    } else {
      const newSelection: number[] = [];
      for (let i = 1; i <= m; i++) {
        if (!paidInYear.has(i)) {
          newSelection.push(i);
        }
      }
      setSelectedMonths(newSelection);
    }
  };

  const handleToggleHistoricMember = (checked: boolean) => {
    setIsHistoricMember(checked);
    if (checked) {
      // Remover taxas iniciais se marcar como histórico
      setExtraFees(prev => prev.filter(f => f.tipo !== "inicial" && f.tipo !== "transferencia"));
    }
    
    // Persistir no banco de dados
    if (socioCpf) {
      memberFinanceConfigService.upsertConfig(socioCpf, { 
        // @ts-expect-error - campo recém adicionado no banco
        socio_historico: checked 
      })
        .catch(err => console.error("Erro ao salvar flag de sócio histórico:", err));
    }
  };

  const addExtraFee = (type: PaymentType) => {
    if (isHistoricMember && (type === "inicial" || type === "transferencia")) return;
    
    let valor = 0;
    if (type === "inicial") valor = settings?.valor_inscricao ?? 0;
    if (type === "transferencia") valor = settings?.valor_transferencia ?? 0;

    setExtraFees(prev => {
      const alreadyExists = prev.find(f => f.tipo === type);
      if (alreadyExists) {
        return prev.filter(f => f.tipo !== type);
      }

      let filtered = [...prev];
      if (type === "inicial") {
        filtered = filtered.filter(f => f.tipo !== "transferencia");
      } else if (type === "transferencia") {
        filtered = filtered.filter(f => f.tipo !== "inicial");
      }

      return [...filtered, { 
        tipo: type, 
        valor, 
        displayValue: formatNumericInput(valor),
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
        ? { ...item, valor: numericValue, displayValue: formatNumericInput(numericValue) }
        : item
    ));
  };

  const toggleCharge = (chargeType: ChargeType) => {
    setSelectedCharges((prev) => {
      const exists = prev.find((c) => c.chargeType.id === chargeType.id);
      if (exists) return prev.filter((c) => c.chargeType.id !== chargeType.id);
      const valor = chargeType.valor_padrao ?? 0;
      return [
        ...prev,
        {
          chargeType,
          valor,
          displayValue: formatNumericInput(valor),
          uid: crypto.randomUUID(),
        },
      ];
    });
  };

  const handleChargeValueChange = (uid: string, rawValue: string) => {
    const digits = rawValue.replaceAll(/\D/g, "");
    const numericValue = Number(digits) / 100;
    setSelectedCharges((prev) =>
      prev.map((c) =>
        c.uid === uid
          ? { ...c, valor: numericValue, displayValue: formatNumericInput(numericValue) }
          : c,
      ),
    );
  };

  const removeCharge = (uid: string) => {
    setSelectedCharges((prev) => prev.filter((c) => c.uid !== uid));
  };

  const totalAnnuities = selectedYears.length * valorAnuidade;
  const totalMonthly = selectedMonths.length * valorMensalidade;
  const totalFees = extraFees.reduce((sum, item) => sum + (item.valor || 0), 0);
  const totalCharges = selectedCharges.reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalValue =
    (paymentCategory === "anuidade" ? totalAnnuities : totalMonthly) +
    totalFees +
    totalCharges;

  const canConfirm =
    totalValue > 0 &&
    ((paymentCategory === "anuidade" && selectedYears.length > 0) ||
      (paymentCategory === "mensalidade" && selectedMonths.length > 0) ||
      extraFees.length > 0 ||
      selectedCharges.length > 0);

  const handleSubmit = async () => {
    if (!socioCpf) return;

    const sessaoId = crypto.randomUUID();
    const items: PaymentSessionItem[] = [
      ...(paymentCategory === "anuidade"
        ? selectedYears.map((year) => ({
            tipo: "anuidade" as const,
            competencia_ano: year,
            valor: valorAnuidade,
          }))
        : selectedMonths.map((month) => ({
            tipo: "mensalidade" as const,
            competencia_ano: selectedYearForMensalidade,
            competencia_mes: month,
            valor: valorMensalidade,
          }))),
      ...extraFees.map(({ tipo, valor }) => ({ tipo, valor })),
      ...selectedCharges.map(({ chargeType, valor }) => ({
        tipo: chargeType.categoria as PaymentType,
        tipo_cobranca_id: chargeType.id,
        valor,
        descricao: chargeType.nome,
      })),
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
    setSelectedMonths([]);
    setExtraFees([]);
    setSelectedCharges([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl p-0 outline-none [&>button]:hidden overflow-hidden bg-white shadow-2xl rounded-2xl border-none">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Wallet className="h-5 w-5" />
                <DialogTitle className="text-xl font-bold tracking-tight">Novo Lançamento Financeiro</DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Recibo de Sessão de Pagamento · <span className="font-bold text-slate-500 uppercase text-[10px] tracking-tight">{paymentMethod}</span>
              </p>
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
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 h-full max-h-[85vh]">
          <div className="space-y-6 py-6 ring-0 border-none outline-none">
            {/* Member Preview */}
            <MemberFinancePreview 
              name={socioName} 
              cpf={socioCpf ?? undefined} 
              status={status}
              regime={regime}
            />

            {/* Payment Items Form */}
            <PaymentItemForm
              currentYear={currentYear}
              anoBase={anoBase}
              valorAnuidade={valorAnuidade}
              lancamentos={lancamentos}
              isLoadingStatement={isLoadingStatement}
              paymentCategory={paymentCategory}
              onPaymentCategoryChange={setPaymentCategory}
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              selectedMonths={selectedMonths}
              onToggleMonth={toggleMonth}
              selectedYearForMensalidade={selectedYearForMensalidade}
              onYearForMensalidadeChange={setSelectedYearForMensalidade}
              extraFees={extraFees}
              onAddExtraFee={addExtraFee}
              onRemoveExtraFee={removeExtraFee}
              onFeeValueChange={handleFeeValueChange}
              selectedCharges={selectedCharges}
              onToggleCharge={toggleCharge}
              onChargeValueChange={handleChargeValueChange}
              onRemoveCharge={removeCharge}
              isHistoricMember={isHistoricMember}
              onToggleHistoricMember={handleToggleHistoricMember}
            />

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <PaymentMethodSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Data do Recebimento</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10 text-xs font-bold border-slate-200 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ring-8 ring-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">TOTAL A RECEBER</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 text-[11px] font-black h-10 px-4 transition-all"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={paymentMutation.isPending || !canConfirm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] gap-2 h-10 px-6 shadow-xl shadow-emerald-100 transition-all hover:-translate-y-0.5"
                  >
                    {paymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    CONFIRMAR LANÇAMENTO
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
