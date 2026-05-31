import { Building2, Edit, LogIn, MapPin, UserCog } from "lucide-react";
import type { MembershipRow, UnitStat } from "@/modules/administration/types";
import type { TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";

interface UnitCardProps {
  readonly unit: TenantUnitRecord;
  readonly rows: MembershipRow[];
  readonly stats?: UnitStat;
  readonly onEdit: () => void;
  readonly onEnter: () => void;
}

export function UnitCard({ unit, rows, stats, onEdit, onEnter }: UnitCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border/50 p-4 transition-opacity ${!unit.isActive ? "opacity-60" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm text-foreground">{unit.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{unit.code || "—"}</p>
          </div>
        </div>
        <StatusBadge
          variant={unit.isActive ? "success" : "secondary"}
          label={unit.isActive ? "Ativo" : "Inativo"}
        />
      </div>

      {/* Localidade */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span>
          {unit.city
            ? `${unit.city}${unit.state ? `/${unit.state}` : ""}`
            : "Sem localidade"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-2">
        <StatItem label="Operadores" value={rows.length} />
        <StatItem label="Sócios" value={stats?.sociosCount ?? "—"} />
        <StatItem
          label="Pendentes"
          value={stats?.pendingReqCount ?? "—"}
          highlight={typeof stats?.pendingReqCount === "number" && stats.pendingReqCount > 0}
        />
      </div>

      {/* Operators list */}
      {rows.length > 0 && (
        <div className="space-y-1.5">
          {rows.map(({ membership, user }) => (
            <div
              key={membership.id}
              className={`flex items-center gap-2 border-t border-border/30 pt-2 first:border-t-0 first:pt-0 ${!membership.isActive ? "opacity-50" : ""}`}
            >
              <UserCog className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">
                  {user?.name || user?.email || membership.userId}
                </p>
                {user?.email && user.name && (
                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/30 mt-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onEdit}
          aria-label="Editar polo"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {unit.isActive && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={onEnter}
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar
          </Button>
        )}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`text-sm font-semibold tabular-nums ${highlight ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
      >
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
