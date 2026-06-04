import { useState } from "react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2, FileText, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { CancelPaymentDialog } from "../../dialogs/CancelPaymentDialog";
import { EditLancamentoDialog } from "../../dialogs/EditLancamentoDialog";
import { useCancelFinanceActions } from "../../../hooks/edit/useCancelFinanceActions";
import { useUpdateFinanceActions } from "../../../hooks/edit/useUpdateFinanceActions";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { cn } from "@/shared/lib/utils";
import type { FinanceLancamento, FinanceDAE } from "../../../types/finance.types";

const TYPE_LABELS: Record<string, string> = {
  inicial: "Taxa inicial",
  transferencia: "Taxa de transferência",
  contribuicao: "Contribuição",
  cadastro_governamental: "Cadastro governamental",
  mensalidade: "Mensalidade",
};

import { SessionReceiptDialog } from "../../dialogs/SessionReceiptDialog";
import { financeService } from "../../../services/financeService";
import { daeService } from "../../../services/daeService";

interface OtherPaymentsSectionProps {
  readonly lancamentos: FinanceLancamento[];
  readonly memberName?: string;
  readonly memberCpf?: string;
  readonly isSelectionMode?: boolean;
  readonly selectedIds?: string[];
  readonly onToggleSelection?: (id: string, type: 'lancamento' | 'dae') => void;
}

function formatCompetencia(competenciaMes?: number | null, competenciaAno?: number | null) {
  if (!competenciaAno) return null;
  if (competenciaMes) return `${String(competenciaMes).padStart(2, "0")}/${competenciaAno}`;
  return String(competenciaAno);
}

function getPaymentLabel(lancamento: FinanceLancamento) {
  const baseLabel =
    lancamento.descricao ||
    (lancamento.tipo ? TYPE_LABELS[lancamento.tipo] : "") ||
    lancamento.tipo;

  const competencia = formatCompetencia(
    lancamento.competencia_mes,
    lancamento.competencia_ano,
  );

  if (lancamento.tipo === "mensalidade" && competencia) {
    return {
      title: baseLabel || "Mensalidade",
      subtitle: `Competência ${competencia}`,
    };
  }

  return {
    title: baseLabel,
    subtitle: competencia && !lancamento.descricao ? `Referência ${competencia}` : null,
  };
}

export function OtherPaymentsSection({ 
  lancamentos, 
  memberName, 
  memberCpf,
  isSelectionMode,
  selectedIds,
  onToggleSelection
}: OtherPaymentsSectionProps) {
  const [selectedItem, setSelectedItem] = useState<FinanceLancamento | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { cancelPayment } = useCancelFinanceActions();
  const { updatePayment } = useUpdateFinanceActions();
  const { isAdmin } = usePermissions();

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ lancamentos: FinanceLancamento[], daes: FinanceDAE[] }>({ lancamentos: [], daes: [] });
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const handleViewReceipt = async (sessaoId: string) => {
    setIsLoadingReceipt(true);
    try {
      const [l, d] = await Promise.all([
        financeService.getSessionPayments(sessaoId),
        daeService.getSessionDAEs(sessaoId)
      ]);
      setReceiptData({ lancamentos: l, daes: d });
      setIsReceiptOpen(true);
    } catch (error) {
      console.error("Erro ao carregar recibo:", error);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  const sorted = [...lancamentos].sort(
    (a, b) =>
      new Date(b.data_pagamento || 0).getTime() -
      new Date(a.data_pagamento || 0).getTime(),
  );

  const handleDelete = (item: FinanceLancamento) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (item: FinanceLancamento) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        Outros lançamentos
      </p>
      <div className="space-y-1">
        {sorted.map((l) => {
          const paymentLabel = getPaymentLabel(l);

          return (
            <div
              key={l.id}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/30 border border-transparent hover:border-emerald-100/50 dark:hover:border-emerald-800/50 transition-colors",
                isSelectionMode && "cursor-pointer"
              )}
              onClick={() => isSelectionMode && onToggleSelection?.(l.id, 'lancamento')}
            >
            {isSelectionMode && (
              <div className="flex-shrink-0 mr-1">
                <div className={cn(
                  "h-4 w-4 rounded-sm border flex items-center justify-center transition-colors",
                  selectedIds?.includes(l.id) 
                    ? "bg-emerald-600 border-emerald-600 text-white" 
                    : "border-input bg-background"
                )}>
                  {selectedIds?.includes(l.id) && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            )}
            <div className="w-14 text-[11px] font-semibold text-muted-foreground">
              {formatDate(l.data_pagamento)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {paymentLabel.title}
              </p>
              {paymentLabel.subtitle ? (
                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                  {paymentLabel.subtitle}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground leading-none">
                {formatCurrency(l.valor)}
              </p>
            </div>
            {!isSelectionMode && (
              <div className="flex items-center gap-1 ml-2 border-l pl-3">
              {l.sessao_id && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 dark:hover:bg-blue-900/50 hover:text-white dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-800/50"
                        onClick={() => handleViewReceipt(l.sessao_id!)}
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
                          isAdmin ? "hover:bg-emerald-600 dark:hover:bg-emerald-900/50 hover:text-white dark:hover:text-emerald-400 hover:border-emerald-600 dark:hover:border-emerald-800/50" : "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => isAdmin && handleEdit(l)}
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
                          isAdmin ? "hover:bg-red-600 dark:hover:bg-red-900/50 hover:text-white dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-800/50" : "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => isAdmin && handleDelete(l)}
                        disabled={!isAdmin}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={5}>
                      {isAdmin ? "Excluir lançamento" : "Apenas o presidente pode cancelar lançamentos"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <SessionReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        lancamentos={receiptData.lancamentos}
        daes={receiptData.daes}
        memberName={memberName}
        memberCpf={memberCpf ?? lancamentos[0]?.socio_cpf ?? undefined}
      />

      {/* Diálogos de Ação */}
      <CancelPaymentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemId={selectedItem?.id ?? null}
        itemDescription={(() => {
          if (!selectedItem) return "";
          const typeLabel = selectedItem.tipo ? TYPE_LABELS[selectedItem.tipo] : "";
          const description = selectedItem.descricao || typeLabel;
          return `Excluir Lançamento: ${description} (${formatCurrency(selectedItem.valor)})`;
        })()}
        onConfirm={async (observation) => {
          if (selectedItem) {
            await cancelPayment.mutateAsync({ 
              id: selectedItem.id, 
              observation 
            });
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
              { onSuccess: () => setIsEditDialogOpen(false) }
            );
          }
        }}
        isPending={updatePayment.isPending}
      />
    </div>
  );
}
