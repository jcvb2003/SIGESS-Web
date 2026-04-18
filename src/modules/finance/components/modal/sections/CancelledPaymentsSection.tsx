import { useState } from "react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { Button } from "@/shared/components/ui/button";
import { Trash2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { PurgePaymentDialog } from "../../dialogs/PurgePaymentDialog";
import { usePermissions } from "@/shared/hooks/usePermissions";
import type { FinanceLancamento } from "../../../types/finance.types";

interface CancelledPaymentsSectionProps {
  readonly lancamentos: FinanceLancamento[];
}

export function CancelledPaymentsSection({ lancamentos }: CancelledPaymentsSectionProps) {
  const [selectedItem, setSelectedItem] = useState<FinanceLancamento | null>(null);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const { isAdmin } = usePermissions();

  const handlePurge = (item: FinanceLancamento) => {
    setSelectedItem(item);
    setIsPurgeOpen(true);
  };

  if (lancamentos.length === 0) return null;

  return (
    <div className="pt-4 border-t border-dashed">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
          Lançamentos Cancelados
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-orange-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-[10px]">
              Estes registros foram cancelados e não afetam o saldo. Admins podem expurgá-los permanentemente.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-1">
        {lancamentos.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 rounded-lg py-2 px-2 bg-orange-50/20 border border-orange-100/30 opacity-70 grayscale-[0.5] hover:grayscale-0 transition-all"
          >
            <div className="w-14 text-[11px] font-semibold text-slate-400">
              {formatDate(l.data_pagamento)}
            </div>
            <div className="flex-1 min-w-0 text-xs font-medium text-slate-500">
              {l.descricao || l.tipo || "Sem descrição"}
              {l.cancelamento_obs && (
                <span className="block text-[10px] text-orange-600/70 italic truncate">
                  Motivo: {l.cancelamento_obs}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 line-through">
                {formatCurrency(l.valor)}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-2 border-l pl-3">
              {isAdmin && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => handlePurge(l)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={5}>Expurgar permanentemente</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        ))}
      </div>

      <PurgePaymentDialog
        open={isPurgeOpen}
        onOpenChange={setIsPurgeOpen}
        itemId={selectedItem?.id ?? null}
        itemDescription={selectedItem ? `${selectedItem.descricao || selectedItem.tipo} (${formatCurrency(selectedItem.valor)})` : ""}
      />
    </div>
  );
}
