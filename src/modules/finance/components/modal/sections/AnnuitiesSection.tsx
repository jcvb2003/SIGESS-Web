import { useState } from "react";
import { FinancialStatusBadge } from "../../shared/FinancialStatusBadge";
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
import { SessionReceiptDialog } from "../../dialogs/SessionReceiptDialog";
import { financeService } from "../../../services/financeService";
import { daeService } from "../../../services/daeService";

import { PAYMENT_METHOD_LABELS } from "../../shared/constants";

interface AnnuitiesSectionProps {
  readonly anuidades: FinanceLancamento[];
  readonly memberName?: string;
  readonly memberCpf?: string;
  readonly isSelectionMode?: boolean;
  readonly selectedIds?: string[];
  readonly onToggleSelection?: (id: string, type: 'lancamento' | 'dae') => void;
}

export function AnnuitiesSection({ 
  anuidades, 
  memberName, 
  memberCpf,
  isSelectionMode,
  selectedIds,
  onToggleSelection
}: AnnuitiesSectionProps) {
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

  const sorted = [...anuidades].sort(
    (a, b) => (b.competencia_ano ?? 0) - (a.competencia_ano ?? 0),
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
        Anuidades
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground/70 py-2">
          Nenhuma anuidade registrada.
        </p>
      ) : (
        <div className="space-y-1">
          {sorted.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/30 border border-transparent hover:border-emerald-100/50 dark:hover:border-emerald-800/50 transition-colors",
                isSelectionMode && "cursor-pointer"
              )}
              onClick={() => isSelectionMode && onToggleSelection?.(a.id, 'lancamento')}
            >
              {isSelectionMode && (
                <div className="flex-shrink-0 mr-1">
                  <div className={cn(
                    "h-4 w-4 rounded-sm border flex items-center justify-center transition-colors",
                    selectedIds?.includes(a.id) 
                      ? "bg-emerald-600 border-emerald-600 text-white" 
                      : "border-input bg-background"
                  )}>
                    {selectedIds?.includes(a.id) && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              )}
              <div className="w-10 text-sm font-bold text-emerald-700 dark:text-emerald-500">
                {a.competencia_ano}
              </div>
              <div className="flex-1 min-w-0">
                <FinancialStatusBadge
                  status="ok"
                  detail={`Pago em ${formatDate(a.data_pagamento)}`}
                  className="h-5 text-[10px] bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-500"
                />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {formatCurrency(a.valor)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {a.forma_pagamento ? PAYMENT_METHOD_LABELS[a.forma_pagamento] : ""}
                </p>
              </div>
              {!isSelectionMode && (
                <div className="flex items-center gap-1 ml-2 border-l pl-3">
                {a.sessao_id && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 dark:hover:bg-blue-900/50 hover:text-white dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-800/50"
                          onClick={() => handleViewReceipt(a.sessao_id!)}
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
                         onClick={() => isAdmin && handleEdit(a)}
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
                        onClick={() => isAdmin && handleDelete(a)}
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
          ))}
        </div>
      )}

      {/* Diálogos de Ação */}
      <CancelPaymentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemId={selectedItem?.id ?? null}
        itemDescription={selectedItem ? `Excluir Anuidade ${selectedItem.competencia_ano} (${formatCurrency(selectedItem.valor)})` : ""}
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
        title="Cancelar Anuidade"
      />

      <SessionReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        lancamentos={receiptData.lancamentos}
        daes={receiptData.daes}
        memberName={memberName}
        memberCpf={memberCpf ?? anuidades[0]?.socio_cpf ?? undefined}
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
