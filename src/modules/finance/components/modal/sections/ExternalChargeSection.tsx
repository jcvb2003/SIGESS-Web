import { ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useExternalCharges } from "../../../hooks/data/useExternalCharges";
import type { ExternalCharge } from "../../../services/externalChargeService";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  cancelada: "Cancelada",
  expirada: "Expirada",
  falha: "Falha na criação",
};

const STATUS_VARIANT: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  paga: "bg-success/10 text-success border-success/20",
  cancelada: "bg-muted text-muted-foreground",
  expirada: "bg-destructive/10 text-destructive border-destructive/20",
  falha: "bg-destructive/10 text-destructive border-destructive/20",
};

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
      {provider}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_VARIANT[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ChargeRow({ charge, onSync, isSyncing }: {
  charge: ExternalCharge;
  onSync: () => void;
  isSyncing: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-card/50 p-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <ProviderBadge provider={charge.provider} />
          <StatusBadge status={charge.status} />
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
          {charge.valor != null && <span>{formatCurrency(charge.valor)}</span>}
          {charge.data_vencimento && <span>Venc. {formatDate(charge.data_vencimento)}</span>}
          {charge.last_synced_at && <span>Sync {formatDate(charge.last_synced_at)}</span>}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {charge.payment_url && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={charge.payment_url} target="_blank" rel="noopener noreferrer" title="Abrir cobrança">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onSync}
          disabled={isSyncing}
          title="Sincronizar status"
        >
          {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export function ExternalChargeSection({ cpf }: { cpf: string }) {
  const { charges, isLoading, sync, isSyncing } = useExternalCharges(cpf);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (charges.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Cobranças externas
      </p>
      <div className="space-y-2">
        {charges.map((charge) => (
          <ChargeRow
            key={charge.id}
            charge={charge}
            onSync={() => sync(charge.id)}
            isSyncing={isSyncing}
          />
        ))}
      </div>
    </div>
  );
}
