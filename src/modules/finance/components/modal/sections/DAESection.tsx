import { useState } from "react";
import { 
  Trash2, 
  Pencil
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { FinancialStatusBadge } from "../../shared/FinancialStatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { CancelPaymentDialog } from "../../dialogs/CancelPaymentDialog";
import { EditDAEDialog } from "../../dialogs/EditDAEDialog";
import { useCancelFinanceActions } from "../../../hooks/edit/useCancelFinanceActions";
import { useUpdateFinanceActions } from "../../../hooks/edit/useUpdateFinanceActions";
import type { FinanceDAE } from "../../../types/finance.types";

const MONTH_LABELS = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface DAESectionProps {
  readonly daes: FinanceDAE[];
}

export function DAESection({ daes }: DAESectionProps) {
  const [selectedItem, setSelectedItem] = useState<FinanceDAE | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { cancelDAE } = useCancelFinanceActions();
  const { updateDAE } = useUpdateFinanceActions();

  const sorted = [...daes].sort((a, b) => {
    const ya = a.competencia_ano * 100 + a.competencia_mes;
    const yb = b.competencia_ano * 100 + b.competencia_mes;
    return yb - ya;
  });

  const handleDelete = (item: FinanceDAE) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (item: FinanceDAE) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        DAE (Previdência Social)
      </p>
      <div className="space-y-1">
        {sorted.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-emerald-50/40 border border-transparent hover:border-emerald-100/50 transition-colors"
          >
            <div className="w-14 text-xs font-semibold text-slate-600">
              {MONTH_LABELS[d.competencia_mes]}/{String(d.competencia_ano).slice(-2)}
            </div>
            <div className="flex-1 min-w-0">
              <FinancialStatusBadge
                status={d.boleto_pago ? "ok" : "released"}
                detail={
                  d.boleto_pago
                    ? "Recebido · Boleto pago ✓"
                    : "Recebido · Boleto pendente"
                }
                className={`h-5 text-[10px] ${
                  d.boleto_pago 
                    ? "bg-emerald-100/50 border-emerald-200/50 text-emerald-700" 
                    : "bg-amber-100/50 border-amber-200/50 text-amber-700"
                }`}
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-none">
                {formatCurrency(d.valor)}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-2 border-l pl-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={() => handleEdit(d)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar DAE</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(d)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir DAE</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>

      {/* Diálogo de Ação */}
      <CancelPaymentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemId={selectedItem?.id ?? null}
        itemDescription={selectedItem ? `Excluir Repasse DAE: ${MONTH_LABELS[selectedItem.competencia_mes]}/${selectedItem.competencia_ano}` : ""}
        onConfirm={async (observation) => {
          if (selectedItem) {
            await cancelDAE.mutateAsync({ 
              id: selectedItem.id, 
              observation 
            });
            setIsDeleteDialogOpen(false);
          }
        }}
        isPending={cancelDAE.isPending}
        title="Cancelar Repasse DAE"
      />

      <EditDAEDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        dae={selectedItem}
        onConfirm={(data) => {
          if (selectedItem) {
            updateDAE.mutate(
              { id: selectedItem.id, data },
              { onSuccess: () => setIsEditDialogOpen(false) }
            );
          }
        }}
        isPending={updateDAE.isPending}
      />
    </div>
  );
}
