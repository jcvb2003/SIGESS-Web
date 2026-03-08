import { useState } from "react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2, FileText } from "lucide-react";
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
}

export function OtherPaymentsSection({ lancamentos }: OtherPaymentsSectionProps) {
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
        {sorted.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-emerald-50/40 border border-transparent hover:border-emerald-100/50 transition-colors"
          >
            <div className="w-14 text-[11px] font-semibold text-slate-500">
              {formatDate(l.data_pagamento)}
            </div>
            <div className="flex-1 min-w-0 text-xs font-medium text-slate-700">
              {l.descricao || (l.tipo ? TYPE_LABELS[l.tipo] : "") || l.tipo}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-none">
                {formatCurrency(l.valor)}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-2 border-l pl-3">
              {l.sessao_id && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 hover:text-white hover:border-blue-600"
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
                          isAdmin ? "hover:bg-emerald-600 hover:text-white hover:border-emerald-600" : "opacity-50 cursor-not-allowed"
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
                          isAdmin ? "hover:bg-red-600 hover:text-white hover:border-red-600" : "opacity-50 cursor-not-allowed"
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
          </div>
        ))}
      </div>

      <SessionReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        lancamentos={receiptData.lancamentos}
        daes={receiptData.daes}
        memberCpf={lancamentos[0]?.socio_cpf ?? undefined}
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
