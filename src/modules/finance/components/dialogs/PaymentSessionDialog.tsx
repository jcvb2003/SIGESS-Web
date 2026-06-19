import { useEffect, useMemo, useState } from "react";
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
import { usePaymentSessionForm } from "../../hooks/edit/usePaymentSessionForm";
import { isExtraFeeBlockedByHistoricMember } from "../../domain/paymentEligibility";
import { useFinanceSettings } from "../../hooks/data/useFinanceSettings";
import { useMemberStatement } from "../../hooks/data/useMemberStatement";
import { memberFinanceConfigService } from "../../services/memberFinanceConfigService";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { generateUUID } from "@/shared/utils/uuid";
import { MemberFinancePreview } from "../shared/MemberFinancePreview";
import { PaymentMethodSelect } from "../shared/PaymentMethodSelect";
import { PaymentItemForm } from "../forms/PaymentItemForm";
import {
  Loader2,
  Check,
  Wallet,
  X,
  Pencil,
  Settings2,
  Unlock,
} from "lucide-react";
import type {
  PaymentSessionItem,
  PaymentType,
  FinancialStatusType,
  ChargeType,
  FinanceLancamento,
} from "../../types/finance.types";
import { MemberFinanceConfigForm } from "../forms/MemberFinanceConfigForm";
import { toast } from "sonner";
import {
  buildMonthStartDate,
  getFirstRequiredMonthForYear,
  getMonthYearFromDate,
} from "../../utils/membershipCompetency";

interface PaymentSessionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly socioCpf: string | null;
  readonly socioName?: string;
  readonly dataDeAdmissao?: string | null;
  readonly status?: FinancialStatusType;
  readonly regime?: string;
}

export function PaymentSessionDialog({
  open,
  onOpenChange,
  socioCpf,
  socioName,
  dataDeAdmissao,
  status,
  regime,
}: PaymentSessionDialogProps) {
  const { settings } = useFinanceSettings();
  const { lancamentos, isLoading: isLoadingStatement } = useMemberStatement(open ? socioCpf : null);
  const paymentMutation = usePaymentSession();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { state: paymentForm, dispatch: dispatchPaymentForm } =
    usePaymentSessionForm(currentYear);
  const {
    paymentCategory,
    selectedYears,
    selectedMonths,
    selectedYearForMensalidade,
    allowRetroactiveMonthly,
    extraFees,
    selectedCharges,
    paymentMethod,
    paymentDate,
    isHistoricMember,
    configMode,
  } = paymentForm;

  const anoBase = settings?.ano_base_cobranca ?? 2024;
  const valorAnuidade = settings?.valor_anuidade ?? 0;
  const valorMensalidade = settings?.valor_mensalidade ?? (valorAnuidade / 12);
  const [savedGraceStartDate, setSavedGraceStartDate] = useState<string | null>(null);
  const [gracePeriodEnabled, setGracePeriodEnabled] = useState(false);
  const [gracePeriodMonth, setGracePeriodMonth] = useState<number>(currentMonth);
  const [gracePeriodYear, setGracePeriodYear] = useState<number>(currentYear);

  const resetPaymentForm = () => {
    dispatchPaymentForm({ type: "reset", currentYear });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetPaymentForm();
    }
    onOpenChange(nextOpen);
  };

  const toggleYear = (year: number) => {
    dispatchPaymentForm({ type: "toggleYear", year, valorAnuidade });
  };

  const handleAnnuityValueChange = (year: number, rawValue: string) => {
    dispatchPaymentForm({ type: "updateAnnuityValue", year, rawValue });
  };

  useEffect(() => {
    async function loadConfig() {
      if (open && socioCpf) {
        try {
          const config = await memberFinanceConfigService.getConfig(socioCpf);
          dispatchPaymentForm({
            type: "setHistoricMember",
            checked: config?.socio_historico ?? false,
          });
          const savedDate = config?.data_inicio_cobranca ?? null;
          const fallbackDate =
            savedDate ??
            dataDeAdmissao ??
            buildMonthStartDate(currentYear, currentMonth);
          const { admissionMonth, admissionYear } =
            getMonthYearFromDate(fallbackDate);

          setSavedGraceStartDate(savedDate);
          setGracePeriodEnabled(savedDate != null);
          setGracePeriodMonth(admissionMonth ?? currentMonth);
          setGracePeriodYear(admissionYear ?? currentYear);
        } catch (error) {
          console.error("Erro ao carregar configuração financeira:", error);
        }
      }
    }
    loadConfig();
  }, [
    currentMonth,
    currentYear,
    dataDeAdmissao,
    dispatchPaymentForm,
    open,
    socioCpf,
  ]);

  useEffect(() => {
    if (open) {
      dispatchPaymentForm({
        type: "setAllowRetroactiveMonthly",
        checked: false,
      });
    }
  }, [dispatchPaymentForm, open, socioCpf]);

  const gracePeriodStartDate = useMemo(() => {
    if (!gracePeriodEnabled) return null;
    return buildMonthStartDate(gracePeriodYear, gracePeriodMonth);
  }, [gracePeriodEnabled, gracePeriodMonth, gracePeriodYear]);

  const effectiveChargeStartDate = gracePeriodStartDate ?? dataDeAdmissao ?? null;

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

    const firstAllowedMonth = allowRetroactiveMonthly
      ? 1
      : getFirstRequiredMonthForYear(
          selectedYearForMensalidade,
          effectiveChargeStartDate,
        );

    if (m < firstAllowedMonth) return;

    if (selectedMonths.includes(m)) {
      dispatchPaymentForm({
        type: "setSelectedMonths",
        months: selectedMonths.filter(
          (month) => month >= firstAllowedMonth && month < m,
        ),
      });
    } else {
      const newSelection: number[] = [];
      for (let i = firstAllowedMonth; i <= m; i++) {
        if (!paidInYear.has(i)) {
          newSelection.push(i);
        }
      }
      dispatchPaymentForm({ type: "setSelectedMonths", months: newSelection });
    }
  };

  const handleToggleHistoricMember = (checked: boolean) => {
    dispatchPaymentForm({ type: "setHistoricMember", checked });
    
    // Persistir no banco de dados
    if (socioCpf) {
      memberFinanceConfigService.upsertConfig(socioCpf, { 
        socio_historico: checked 
      })
        .catch(err => console.error("Erro ao salvar flag de sócio histórico:", err));
    }
  };

  const addExtraFee = (type: PaymentType) => {
    if (isHistoricMember && isExtraFeeBlockedByHistoricMember(type)) return;
    
    let valor = 0;
    if (type === "inicial") valor = settings?.valor_inscricao ?? 0;
    if (type === "transferencia") valor = settings?.valor_transferencia ?? 0;

    dispatchPaymentForm({
      type: "toggleExtraFee",
      paymentType: type,
      value: valor,
      uid: generateUUID(),
    });
  };

  const removeExtraFee = (uid: string) => {
    dispatchPaymentForm({ type: "removeExtraFee", uid });
  };

  const handleFeeValueChange = (uid: string, rawValue: string) => {
    dispatchPaymentForm({ type: "updateExtraFeeValue", uid, rawValue });
  };

  const toggleCharge = (chargeType: ChargeType) => {
    dispatchPaymentForm({
      type: "toggleCharge",
      chargeType,
      uid: generateUUID(),
    });
  };

  const handleChargeValueChange = (uid: string, rawValue: string) => {
    dispatchPaymentForm({ type: "updateChargeValue", uid, rawValue });
  };

  const removeCharge = (uid: string) => {
    dispatchPaymentForm({ type: "removeCharge", uid });
  };

  const totalAnnuities = selectedYears.reduce((sum, item) => sum + (item.valor || 0), 0);
  const totalMonthly = selectedMonths.length * valorMensalidade;
  const totalFees = extraFees.reduce((sum, item) => sum + (item.valor || 0), 0);
  const totalCharges = selectedCharges.reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalValue =
    (paymentCategory === "anuidade" ? totalAnnuities : totalMonthly) +
    totalFees +
    totalCharges;
  const hasPaidMonthlyLaunch = useMemo(
    () =>
      lancamentos.some(
        (launch) => launch.tipo === "mensalidade" && launch.status === "pago",
      ),
    [lancamentos],
  );

  const canConfirm =
    totalValue > 0 &&
    ((paymentCategory === "anuidade" && selectedYears.length > 0) ||
      (paymentCategory === "mensalidade" && selectedMonths.length > 0) ||
      extraFees.length > 0 ||
      selectedCharges.length > 0);

  const handleSubmit = async () => {
    if (!socioCpf) return;

    if (savedGraceStartDate !== gracePeriodStartDate) {
      try {
        await memberFinanceConfigService.upsertConfig(socioCpf, {
          data_inicio_cobranca: gracePeriodStartDate,
        });
        setSavedGraceStartDate(gracePeriodStartDate);
      } catch (error) {
        console.error("Erro ao salvar carência financeira:", error);
        toast.error(
          "Não foi possível salvar a carência. O lançamento será processado normalmente.",
        );
      }
    }

    const sessaoId = generateUUID();
    const items: PaymentSessionItem[] = [
      ...(paymentCategory === "anuidade"
        ? selectedYears.map((ann) => ({
            tipo: "anuidade" as const,
            competencia_ano: ann.year,
            valor: ann.valor,
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

    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-xl p-0 outline-none [&>button]:hidden overflow-hidden bg-card shadow-2xl rounded-2xl border-none">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Wallet className="h-5 w-5" />
                <DialogTitle className="text-xl font-bold tracking-tight">Novo Lançamento Financeiro</DialogTitle>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Recibo de Sessão de Pagamento · <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-tight">{paymentMethod}</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border transition-colors"
              onClick={() => handleOpenChange(false)}
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
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  dispatchPaymentForm({
                    type: "setConfigMode",
                    mode: configMode === "isencao" ? null : "isencao",
                  })
                }
                className="h-8 pr-3 pl-2.5 text-[10px] font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                <Pencil className="h-3 w-3" />
                Isenção
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  dispatchPaymentForm({
                    type: "setConfigMode",
                    mode: configMode === "regime" ? null : "regime",
                  })
                }
                className="h-8 pr-3 pl-2.5 text-[10px] font-bold gap-1.5 border-border text-muted-foreground hover:bg-foreground hover:text-background transition-all"
              >
                <Settings2 className="h-3 w-3" />
                Regime
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  dispatchPaymentForm({
                    type: "setConfigMode",
                    mode: configMode === "liberacao" ? null : "liberacao",
                  })
                }
                className="h-8 pr-3 pl-2.5 text-[10px] font-bold gap-1.5 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-500 hover:bg-amber-500 dark:hover:bg-amber-900/40 hover:text-white dark:hover:text-amber-400 hover:border-amber-500 dark:hover:border-amber-800/50 transition-all"
              >
                <Unlock className="h-3 w-3" />
                Liberar
              </Button>
            </MemberFinancePreview>

            {/* Config Panel (inline) - Independent from main form submit */}
            {configMode && socioCpf && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <MemberFinanceConfigForm
                  cpf={socioCpf}
                  mode={configMode}
                  onClose={() =>
                    dispatchPaymentForm({ type: "setConfigMode", mode: null })
                  }
                />
              </div>
            )}

            {/* Payment Items Form */}
            <PaymentItemForm
              currentYear={currentYear}
              anoBase={anoBase}
              lancamentos={lancamentos}
              isLoadingStatement={isLoadingStatement}
              paymentCategory={paymentCategory}
              onPaymentCategoryChange={(category) =>
                dispatchPaymentForm({ type: "setPaymentCategory", category })
              }
              selectedYears={selectedYears}
              onToggleYear={toggleYear}
              onAnnuityValueChange={handleAnnuityValueChange}
              selectedMonths={selectedMonths}
              onToggleMonth={toggleMonth}
              selectedYearForMensalidade={selectedYearForMensalidade}
              memberAdmissionDate={effectiveChargeStartDate}
              allowRetroactiveMonthly={allowRetroactiveMonthly}
              onAllowRetroactiveMonthlyChange={(checked) =>
                dispatchPaymentForm({
                  type: "setAllowRetroactiveMonthly",
                  checked,
                })
              }
              canConfigureGracePeriod={!hasPaidMonthlyLaunch}
              gracePeriodEnabled={gracePeriodEnabled}
              onGracePeriodToggle={() =>
                setGracePeriodEnabled((current) => !current)
              }
              gracePeriodMonth={gracePeriodMonth}
              onGracePeriodMonthChange={setGracePeriodMonth}
              gracePeriodYear={gracePeriodYear}
              onGracePeriodYearChange={setGracePeriodYear}
              onYearForMensalidadeChange={(year) =>
                dispatchPaymentForm({ type: "setSelectedYearForMensalidade", year })
              }
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
                onChange={(method) =>
                  dispatchPaymentForm({ type: "setPaymentMethod", method })
                }
              />
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Data do Recebimento</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) =>
                    dispatchPaymentForm({
                      type: "setPaymentDate",
                      date: e.target.value,
                    })
                  }
                  className="h-10 text-xs font-bold border-border focus:ring-primary bg-card"
                />
              </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-4 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm ring-8 ring-muted/20">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">TOTAL A RECEBER</span>
                  <span className="text-2xl font-black text-foreground tracking-tight">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                      className="text-xs font-bold h-10 px-4 transition-colors rounded-lg"
                    >
                      Cancelar
                    </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={paymentMutation.isPending || !canConfirm}
                    className="bg-primary hover:bg-primary/90 text-white font-black text-[11px] gap-2 h-10 px-6 shadow-md dark:shadow-none transition-all hover:-translate-y-0.5"
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
