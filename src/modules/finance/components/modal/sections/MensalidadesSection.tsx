import { useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Loader2, RotateCcw, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { cn } from "@/shared/lib/utils";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useCancelFinanceActions } from "../../../hooks/edit/useCancelFinanceActions";
import { useUpdateFinanceActions } from "../../../hooks/edit/useUpdateFinanceActions";
import { financeService } from "../../../services/financeService";
import { daeService } from "../../../services/daeService";
import { CancelPaymentDialog } from "../../dialogs/CancelPaymentDialog";
import { EditLancamentoDialog } from "../../dialogs/EditLancamentoDialog";
import { SessionReceiptDialog } from "../../dialogs/SessionReceiptDialog";
import type { FinanceLancamento, FinanceDAE } from "../../../types/finance.types";
import type { ExternalCharge } from "../../../services/externalChargeService";

const MONTH_LABELS = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  transferencia: "Transferência",
  boleto: "Boleto",
  cartao: "Cartão",
};

const FCX_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  cancelada: "Cancelada",
  expirada: "Expirada",
  falha: "Falha",
};

const FCX_STATUS_CLASS: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  paga: "bg-success/10 text-success border-success/20",
  cancelada: "bg-muted text-muted-foreground",
  expirada: "bg-destructive/10 text-destructive border-destructive/20",
  falha: "bg-destructive/10 text-destructive border-destructive/20",
};

const REISSUABLE = new Set(["falha", "expirada"]);

interface MensalidadesSectionProps {
  lancamentos: FinanceLancamento[];
  charges: ExternalCharge[];
  memberName?: string;
  memberCpf?: string;
  sync: (fcxId: string) => void;
  isSyncingId: (id: string) => boolean;
  reissue: (lancId: string, billing: "BOLETO" | "PIX", dueDate: string) => void;
  isReissuingLancId: (lancId: string) => boolean;
}

type CompKey = `${number}-${number}`;
type CompRow = {
  ano: number;
  mes: number;
  lancamentos: FinanceLancamento[];
  charges: ExternalCharge[];
};

export function MensalidadesSection({
  lancamentos,
  charges,
  memberName,
  memberCpf,
  sync,
  isSyncingId,
  reissue,
  isReissuingLancId,
}: MensalidadesSectionProps) {
  const [selectedItem, setSelectedItem] = useState<FinanceLancamento | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ lancamentos: FinanceLancamento[]; daes: FinanceDAE[] }>({ lancamentos: [], daes: [] });
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const { cancelPayment } = useCancelFinanceActions();
  const { updatePayment } = useUpdateFinanceActions();
  const { isAdmin } = usePermissions();

  const handleViewReceipt = async (sessaoId: string) => {
    setIsLoadingReceipt(true);
    try {
      const [l, d] = await Promise.all([
        financeService.getSessionPayments(sessaoId),
        daeService.getSessionDAEs(sessaoId),
      ]);
      setReceiptData({ lancamentos: l, daes: d });
      setIsReceiptOpen(true);
    } catch (err) {
      console.error("Erro ao carregar recibo:", err);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  const rows = useMemo<CompRow[]>(() => {
    const grouped = new Map<CompKey, CompRow>();

    for (const l of lancamentos) {
      if (!l.competencia_ano || !l.competencia_mes) continue;
      const key: CompKey = `${l.competencia_ano}-${l.competencia_mes}`;
      if (!grouped.has(key)) {
        grouped.set(key, { ano: l.competencia_ano, mes: l.competencia_mes, lancamentos: [], charges: [] });
      }
      grouped.get(key)!.lancamentos.push(l);
    }

    for (const c of charges) {
      if (!c.competencia_ano || !c.competencia_mes) continue;
      const key: CompKey = `${c.competencia_ano}-${c.competencia_mes}`;
      if (grouped.has(key)) grouped.get(key)!.charges.push(c);
    }

    return [...grouped.values()].sort((a, b) => (b.ano * 100 + b.mes) - (a.ano * 100 + a.mes));
  }, [lancamentos, charges]);

  if (rows.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
        Mensalidades
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <CompetenciaRow
            key={`${row.ano}-${row.mes}`}
            row={row}
            isAdmin={isAdmin}
            isLoadingReceipt={isLoadingReceipt}
            onEdit={(l) => { setSelectedItem(l); setIsEditDialogOpen(true); }}
            onDelete={(l) => { setSelectedItem(l); setIsDeleteDialogOpen(true); }}
            onReceipt={handleViewReceipt}
            sync={sync}
            isSyncingId={isSyncingId}
            reissue={reissue}
            isReissuingLancId={isReissuingLancId}
          />
        ))}
      </div>

      <SessionReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        lancamentos={receiptData.lancamentos}
        daes={receiptData.daes}
        memberName={memberName}
        memberCpf={memberCpf ?? lancamentos[0]?.socio_cpf ?? undefined}
      />

      <CancelPaymentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemId={selectedItem?.id ?? null}
        itemDescription={
          selectedItem
            ? `Cancelar mensalidade ${String(selectedItem.competencia_mes).padStart(2, "0")}/${selectedItem.competencia_ano} (${formatCurrency(selectedItem.valor)})`
            : ""
        }
        onConfirm={async (observation) => {
          if (selectedItem) {
            await cancelPayment.mutateAsync({ id: selectedItem.id, observation });
            setIsDeleteDialogOpen(false);
          }
        }}
        isPending={cancelPayment.isPending}
        title="Cancelar Lançamento"
      />

      <EditLancamentoDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        lancamento={selectedItem}
        onConfirm={(data) => {
          if (selectedItem) {
            updatePayment.mutate(
              { id: selectedItem.id, data },
              { onSuccess: () => setIsEditDialogOpen(false) },
            );
          }
        }}
        isPending={updatePayment.isPending}
      />
    </div>
  );
}

function CompetenciaRow({
  row,
  isAdmin,
  isLoadingReceipt,
  onEdit,
  onDelete,
  onReceipt,
  sync,
  isSyncingId,
  reissue,
  isReissuingLancId,
}: {
  row: CompRow;
  isAdmin: boolean;
  isLoadingReceipt: boolean;
  onEdit: (l: FinanceLancamento) => void;
  onDelete: (l: FinanceLancamento) => void;
  onReceipt: (sessaoId: string) => void;
  sync: (fcxId: string) => void;
  isSyncingId: (id: string) => boolean;
  reissue: (lancId: string, billing: "BOLETO" | "PIX", dueDate: string) => void;
  isReissuingLancId: (lancId: string) => boolean;
}) {
  // FCX mais recente não-cancelada
  const fcxAtiva = row.charges.find((c) => c.status !== "cancelada") ?? null;
  const pagoLanc = row.lancamentos.find((l) => l.status === "pago") ?? null;
  const pendenteLanc = row.lancamentos.find((l) => l.status === "pendente") ?? null;

  const mesLabel = MONTH_LABELS[row.mes] ?? String(row.mes);
  const competenciaLabel = `${String(row.mes).padStart(2, "0")}/${row.ano}`;

  return (
    <div className="flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-primary/5 dark:hover:bg-primary/10 border border-transparent hover:border-primary/10 transition-colors">
      {/* Competência */}
      <div className="flex flex-col items-center justify-center min-w-[36px] text-center">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{mesLabel}</span>
        <span className="text-[10px] font-bold text-foreground">{row.ano}</span>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {pagoLanc && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">Mensalidade</span>
            <span className="text-[11px] text-muted-foreground">{competenciaLabel}</span>
          </div>
        )}
        {!pagoLanc && pendenteLanc && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-600">Aguardando</span>
            <span className="text-[11px] text-muted-foreground">{competenciaLabel}</span>
          </div>
        )}
        {!pagoLanc && !pendenteLanc && (
          <span className="text-xs text-muted-foreground">Mensalidade {competenciaLabel}</span>
        )}

        {/* Detalhes pagamento local */}
        {pagoLanc && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {pagoLanc.data_pagamento && (
              <span className="text-[10px] text-muted-foreground">{formatDate(pagoLanc.data_pagamento)}</span>
            )}
            {pagoLanc.forma_pagamento && (
              <span className="text-[10px] text-muted-foreground">
                {PAYMENT_METHOD_LABELS[pagoLanc.forma_pagamento] ?? pagoLanc.forma_pagamento}
              </span>
            )}
          </div>
        )}

        {/* Badge FCX inline */}
        {fcxAtiva && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-4 px-1">
              {fcxAtiva.provider}
            </Badge>
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border ${FCX_STATUS_CLASS[fcxAtiva.status] ?? "bg-muted text-muted-foreground"}`}>
              {FCX_STATUS_LABEL[fcxAtiva.status] ?? fcxAtiva.status}
            </span>
            {fcxAtiva.status === "paga" && (fcxAtiva.webhook_received_at || fcxAtiva.last_synced_at) && (
              <span className="text-[10px] text-muted-foreground">
                {formatDate((fcxAtiva.webhook_received_at ?? fcxAtiva.last_synced_at)!)}
              </span>
            )}
            {fcxAtiva.status !== "paga" && fcxAtiva.data_vencimento && (
              <span className="text-[10px] text-muted-foreground">Venc. {formatDate(fcxAtiva.data_vencimento)}</span>
            )}
            {fcxAtiva.status === "falha" && fcxAtiva.error_message && (
              <span className="text-[10px] text-destructive/80 truncate max-w-[140px]" title={fcxAtiva.error_message}>
                {fcxAtiva.error_message}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Valor */}
      {(pagoLanc ?? pendenteLanc) && (
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold text-foreground leading-none">
            {formatCurrency((pagoLanc ?? pendenteLanc)!.valor)}
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0 border-l pl-2">
        {/* Ações FCX — só quando não está paga (paga = evento encerrado, sem ação) */}
        {fcxAtiva && fcxAtiva.status !== "paga" && (
          <>
            {fcxAtiva.payment_url && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={fcxAtiva.payment_url} target="_blank" rel="noopener noreferrer" title="Abrir cobrança">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => sync(fcxAtiva.id)}
              disabled={isSyncingId(fcxAtiva.id) || isReissuingLancId(fcxAtiva.lancamento_id)}
              title="Sincronizar status"
            >
              {isSyncingId(fcxAtiva.id)
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
            {REISSUABLE.has(fcxAtiva.status) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-amber-600 hover:text-amber-700"
                onClick={() => {
                  const dueDate = fcxAtiva.data_vencimento ?? new Date().toISOString().split("T")[0];
                  reissue(fcxAtiva.lancamento_id, (fcxAtiva.billing_type as "BOLETO" | "PIX" | null) ?? "BOLETO", dueDate);
                }}
                disabled={isReissuingLancId(fcxAtiva.lancamento_id) || isSyncingId(fcxAtiva.id)}
                title="Reemitir cobrança"
              >
                {isReissuingLancId(fcxAtiva.lancamento_id)
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <RotateCcw className="h-3.5 w-3.5" />}
              </Button>
            )}
          </>
        )}

        {/* Ações do lançamento local — só quando não há FCX paga (paga = encerrado externamente) */}
        {pagoLanc && fcxAtiva?.status !== "paga" && (
          <>
            {pagoLanc.sessao_id && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                      onClick={() => onReceipt(pagoLanc.sessao_id!)}
                      disabled={isLoadingReceipt}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5}>Ver comprovante da sessão</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95",
                      isAdmin
                        ? "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        : "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => isAdmin && onEdit(pagoLanc)}
                    disabled={!isAdmin}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5}>
                  {isAdmin ? "Editar lançamento" : "Apenas o presidente pode editar lançamentos"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95",
                      isAdmin
                        ? "hover:bg-red-600 hover:text-white hover:border-red-600"
                        : "opacity-50 cursor-not-allowed",
                    )}
                    onClick={() => isAdmin && onDelete(pagoLanc)}
                    disabled={!isAdmin}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5}>
                  {isAdmin ? "Cancelar lançamento" : "Apenas o presidente pode cancelar lançamentos"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  );
}
