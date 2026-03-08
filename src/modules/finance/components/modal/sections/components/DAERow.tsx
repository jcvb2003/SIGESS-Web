import { format } from "date-fns";
import { 
  Trash2, 
  Pencil, 
  FileText, 
  Calendar 
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { FinancialStatusBadge } from "../../../shared/FinancialStatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { FinanceDAE } from "../../../../types/finance.types";

const MONTH_LABELS = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface DAERowProps {
  readonly group: {
    id: string;
    isGroup: boolean;
    lead: FinanceDAE;
    items: FinanceDAE[];
    totalValue: number;
    competencia_ano: number;
    competencia_mes: number;
    label: string;
  };
  readonly isAdmin: boolean;
  readonly isLoadingReceipt: boolean;
  readonly isStatusPending: boolean;
  readonly onToggleStatus: (item: FinanceDAE) => void;
  readonly onViewReceipt: (sessaoId: string) => void;
  readonly onEdit: (item: FinanceDAE) => void;
  readonly onDelete: (item: FinanceDAE) => void;
}

/**
 * Sub-componente para o ícone de representação do DAE
 */
function DAEIcon({ isGroup, lead }: { readonly isGroup: boolean; readonly lead: FinanceDAE }) {
  if (isGroup) {
    return (
      <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center border bg-blue-50 border-blue-100/50">
        <Calendar className="h-5 w-5 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center border bg-slate-50 border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 leading-none uppercase">
        {MONTH_LABELS[lead.competencia_mes || 0]}
      </span>
      <span className="text-[11px] font-black text-slate-600 group-hover:text-emerald-700">
        {String(lead.competencia_ano || "").slice(-2)}
      </span>
    </div>
  );
}

/**
 * Sub-componente para o status de pagamento
 */
function DAEStatus({ 
  lead, 
  isAdmin, 
  isStatusPending, 
  onToggleStatus 
}: { 
  readonly lead: FinanceDAE; 
  readonly isAdmin: boolean; 
  readonly isStatusPending: boolean; 
  readonly onToggleStatus: (item: FinanceDAE) => void;
}) {
  const isPaid = lead.boleto_pago;
  
  // Lógica simplificada para evitar ternários aninhados e negações
  let tooltipText = "";
  if (isAdmin) {
    tooltipText = isPaid ? "Clique para desmarcar pagamento" : "Clique para registrar pagamento";
  } else {
    tooltipText = "Apenas o presidente pode alterar status de pagamento";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => isAdmin && onToggleStatus(lead)}
            disabled={isStatusPending || !isAdmin}
            className={cn("group/status focus:outline-none", !isAdmin && "cursor-not-allowed opacity-80")}
            title={tooltipText}
          >
            <FinancialStatusBadge 
              status={isPaid ? "ok" : "released"} 
              detail={isPaid ? "Pago" : "Pendente"}
              className={cn(
                "h-5 text-[10px] cursor-pointer shadow-sm group-hover/status:shadow-md transition-all",
                isPaid 
                  ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600" 
                  : "bg-amber-100/50 border-amber-200/50 text-amber-700 hover:bg-amber-200/50"
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Sub-componente para botões de ação
 */
function DAEActions({ 
  group, 
  isAdmin, 
  isLoadingReceipt, 
  onViewReceipt, 
  onEdit, 
  onDelete 
}: { 
  readonly group: DAERowProps["group"];
  readonly isAdmin: boolean;
  readonly isLoadingReceipt: boolean;
  readonly onViewReceipt: (sessaoId: string) => void;
  readonly onEdit: (item: FinanceDAE) => void;
  readonly onDelete: (item: FinanceDAE) => void;
}) {
  const { lead, isGroup } = group;

  // Lógica simplificada de tooltips
  let deleteTooltip = "";
  let editTooltip = "";

  if (isAdmin) {
    deleteTooltip = isGroup ? "Cancelar todo o boleto" : "Excluir DAE";
    editTooltip = "Editar DAE";
  } else {
    deleteTooltip = "Apenas o presidente pode cancelar DAEs";
    editTooltip = "Apenas o presidente pode editar DAEs";
  }

  return (
    <div className="flex items-center gap-1 ml-2 border-l pl-3">
      {lead.sessao_id && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                onClick={() => onViewReceipt(lead.sessao_id as string)}
                disabled={isLoadingReceipt}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={5}>Ver comprovante da sessão</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {!isGroup && (
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
                onClick={() => isAdmin && onEdit(lead)}
                disabled={!isAdmin}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={5}>{editTooltip}</TooltipContent>
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
                isAdmin ? "hover:bg-red-600 hover:text-white hover:border-red-600" : "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isAdmin && onDelete(lead)}
              disabled={!isAdmin}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5}>{deleteTooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function DAERow({
  group,
  isAdmin,
  isLoadingReceipt,
  isStatusPending,
  onToggleStatus,
  onViewReceipt,
  onEdit,
  onDelete,
}: DAERowProps) {
  const { lead, isGroup, label, items, totalValue } = group;

  const daeTypeLabel = isGroup 
    ? "Boleto Agrupado" 
    : `DAE ${(lead.tipo_boleto || "").charAt(0).toUpperCase() + (lead.tipo_boleto || "").slice(1)}`;

  return (
    <div 
      className={cn(
        "group flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
        isGroup 
          ? "bg-slate-50/50 border-slate-200 hover:border-blue-200 hover:shadow-blue-500/5 hover:bg-blue-50/30" 
          : "bg-white border-slate-200/60 hover:border-emerald-200 hover:shadow-emerald-500/5"
      )}
    >
      <div className="flex items-center gap-4">
        <DAEIcon isGroup={isGroup} lead={lead} />
        
        <div>
          <p className="text-xs font-bold text-slate-700">
            {daeTypeLabel}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              {isGroup ? (
                <span className="font-medium text-blue-600/70">{label}</span>
              ) : (
                <>
                  <Calendar className="h-2.5 w-2.5" />
                  {format(new Date(lead.data_recebimento || 0), "dd/MM/yyyy")}
                </>
              )}
            </span>
            {isGroup && (
              <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-black uppercase tracking-tighter">
                {items.length} Meses
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center px-4">
        <DAEStatus 
          lead={lead} 
          isAdmin={isAdmin} 
          isStatusPending={isStatusPending} 
          onToggleStatus={onToggleStatus} 
        />
      </div>

      <div className="text-right">
        <p className={cn(
          "text-xs font-bold leading-none",
          isGroup ? "text-blue-700" : "text-slate-700"
        )}>
          {formatCurrency(totalValue)}
        </p>
      </div>

      <DAEActions 
        group={group}
        isAdmin={isAdmin}
        isLoadingReceipt={isLoadingReceipt}
        onViewReceipt={onViewReceipt}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
