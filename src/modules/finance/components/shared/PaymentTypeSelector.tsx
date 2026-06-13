import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { cn } from "@/shared/lib/utils";
import { useChargeTypes } from "../../hooks/data/useChargeTypes";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import type { ChargeType } from "../../types/finance.types";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

export interface SelectedCharge {
  chargeType: ChargeType;
  valor: number;
  displayValue: string;
  uid: string;
}

interface PaymentTypeSelectorProps {
  readonly selected: SelectedCharge[];
  readonly onToggle: (chargeType: ChargeType) => void;
  readonly onValueChange: (uid: string, rawValue: string) => void;
  readonly onRemove: (uid: string) => void;
}

export function PaymentTypeSelector({
  selected,
  onToggle,
  onValueChange,
  onRemove,
}: PaymentTypeSelectorProps) {
  const { unitId } = useActiveScope();
  const { chargeTypes, isLoading } = useChargeTypes(true, unitId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando tipos de cobrança...
      </div>
    );
  }

  if (chargeTypes.length === 0) return null;

  const selectedIds = new Set(selected.map((s) => s.chargeType.id));
  const visible = showAll ? chargeTypes : chargeTypes.slice(0, 4);
  const hasMore = chargeTypes.length > 4;

  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
        <Tag className="h-3 w-3 text-primary" />
        CONTRIBUIÇÕES E CADASTROS
      </Label>

      <div className="flex flex-wrap gap-2">
        {visible.map((ct) => {
          const isSelected = selectedIds.has(ct.id);
          return (
            <Button
              key={ct.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggle(ct)}
              className={cn(
                "h-9 text-[11px] border-border gap-2 px-4 rounded-xl font-bold transition-all max-w-[220px] shadow-sm",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 shadow-primary/10"
                  : "bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              )}
              title={ct.nome ?? undefined}
            >
              <span className="truncate">
                {ct.nome}
              </span>
              {ct.valor_padrao && (
                <span
                  className={cn(
                    "text-[9px] font-black shrink-0",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground/50",
                  )}
                >
                  {formatCurrency(ct.valor_padrao)}
                </span>
              )}
            </Button>
          );
        })}
        {hasMore && !showAll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="h-9 text-[11px] text-muted-foreground hover:text-foreground rounded-xl gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {chargeTypes.length - 4} mais
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 overflow-hidden divide-y divide-border/50 ring-4 ring-muted/20">
          {selected.map((item) => (
            <div key={item.uid} className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-card p-1.5 rounded-md border border-border/50 shadow-sm shrink-0">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground/80 truncate">
                  {item.chargeType.nome}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/60 pointer-events-none">
                    R$
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="h-7 w-24 text-[11px] font-bold text-right pl-6 pr-2 border-border focus-visible:ring-ring bg-card"
                    value={item.displayValue}
                    onChange={(e) => onValueChange(item.uid, e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => onRemove(item.uid)}
                        className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-red-600 dark:hover:bg-red-900/50 hover:text-white dark:hover:text-red-400 hover:border-red-600 dark:hover:border-red-800/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={5}>Remover</TooltipContent>
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
