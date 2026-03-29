import { FinancialStatusBadge } from "../../shared/FinancialStatusBadge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { FinanceLancamento } from "../../../types/finance.types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  transferencia: "Transferência",
  boleto: "Boleto",
  cartao: "Cartão",
};

interface AnnuitiesSectionProps {
  readonly anuidades: FinanceLancamento[];
}

export function AnnuitiesSection({ anuidades }: AnnuitiesSectionProps) {
  const sorted = [...anuidades].sort(
    (a, b) => (b.competencia_ano ?? 0) - (a.competencia_ano ?? 0),
  );

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
              className="flex items-center gap-3 rounded-lg py-2 px-2 hover:bg-emerald-50/40 border border-transparent hover:border-emerald-100/50 transition-colors"
            >
              <div className="w-10 text-sm font-bold text-emerald-700">
                {a.competencia_ano}
              </div>
              <div className="flex-1 min-w-0">
                <FinancialStatusBadge
                  status="ok"
                  detail={`Pago em ${formatDate(a.data_pagamento)}`}
                  className="h-5 text-[10px] bg-emerald-100/50 border-emerald-200/50 text-emerald-700"
                />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 leading-none">
                  {formatCurrency(a.valor)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {PAYMENT_METHOD_LABELS[a.forma_pagamento] ?? a.forma_pagamento}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2 border-l pl-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar lançamento</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir lançamento</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
