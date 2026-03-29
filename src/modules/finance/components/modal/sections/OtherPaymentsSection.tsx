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

const TYPE_LABELS: Record<string, string> = {
  inscricao: "Taxa de inscrição",
  transferencia: "Taxa de transferência",
  contribuicao: "Contribuição",
  cadastro_governamental: "Cadastro governamental",
  mensalidade: "Mensalidade",
};

interface OtherPaymentsSectionProps {
  readonly lancamentos: FinanceLancamento[];
}

export function OtherPaymentsSection({ lancamentos }: OtherPaymentsSectionProps) {
  const sorted = [...lancamentos].sort(
    (a, b) =>
      new Date(b.data_pagamento).getTime() -
      new Date(a.data_pagamento).getTime(),
  );

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
              {l.descricao || TYPE_LABELS[l.tipo] || l.tipo}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-none">
                {formatCurrency(l.valor)}
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
    </div>
  );
}
