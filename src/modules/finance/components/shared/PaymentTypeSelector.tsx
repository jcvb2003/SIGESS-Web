import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { cn } from "@/shared/lib/utils";
import { useChargeTypes } from "../../hooks/data/useChargeTypes";
import type { ChargeType } from "../../types/finance.types";

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
  const { chargeTypes, isLoading } = useChargeTypes(true);
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
      <Label className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
        <Tag className="h-3 w-3 text-emerald-500" />
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
                "h-8 text-xs border-slate-200 gap-1.5 px-3 rounded-full font-bold transition-all max-w-[200px]",
                isSelected
                  ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-white hover:bg-slate-50 text-slate-600",
              )}
              title={ct.nome}
            >
              <span className="truncate">
                {ct.nome}
              </span>
              {ct.valor_padrao && (
                <span
                  className={cn(
                    "text-[9px] font-black shrink-0",
                    isSelected ? "text-emerald-200" : "text-slate-400",
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
            className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-full gap-1"
          >
            <Plus className="h-3 w-3" />
            {chargeTypes.length - 4} mais
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 overflow-hidden divide-y divide-slate-100 ring-4 ring-slate-50">
          {selected.map((item) => (
            <div key={item.uid} className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-white p-1.5 rounded-md border border-slate-100 shadow-sm shrink-0">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-700 truncate">
                  {item.chargeType.nome}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                    R$
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    className="h-7 w-24 text-[11px] font-bold text-right pl-6 pr-2 border-slate-200 focus-visible:ring-emerald-500 bg-white"
                    value={item.displayValue}
                    onChange={(e) => onValueChange(item.uid, e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(item.uid)}
                  className="h-7 w-7 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
