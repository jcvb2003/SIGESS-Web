import { Building2, Layers3 } from "lucide-react";
import { useTenantUnits } from "../context/TenantUnitContext";

export function ActiveUnitBadge() {
  const { activeUnit, hasMultipleUnits } = useTenantUnits();

  if (!hasMultipleUnits || !activeUnit) {
    return null;
  }

  return (
    <div className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 text-left">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Building2 className="h-4.5 w-4.5" />
      </div>
      <div className="space-y-0.5">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
          <Layers3 className="h-3.5 w-3.5" />
          Polo ativo
        </div>
        <p className="text-sm font-semibold text-foreground">{activeUnit.name}</p>
      </div>
    </div>
  );
}
