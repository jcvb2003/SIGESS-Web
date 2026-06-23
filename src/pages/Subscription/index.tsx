import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { useBillingSummary } from "@/modules/billing/hooks/data/useBillingSummary";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  pending_payment: "Aguardando pagamento",
  active: "Ativa",
  overdue: "Em atraso",
  cancelled: "Cancelada",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trialing: "secondary",
  pending_payment: "outline",
  active: "default",
  overdue: "destructive",
  cancelled: "outline",
};

export default function SubscriptionPage() {
  const { data, isLoading, isError, refetch } = useBillingSummary();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Assinatura" description="Situação da sua conta no SIGESS." />
        <Card className="p-6">
          <div className="h-24 animate-pulse rounded-md bg-secondary/40" />
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Assinatura" description="Situação da sua conta no SIGESS." />
        <Card className="p-6 text-sm text-destructive">
          Erro ao carregar dados de assinatura.
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Assinatura" description="Situação da sua conta no SIGESS." />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Conta de cobrança não configurada. Entre em contato com o suporte.
          </p>
        </Card>
      </div>
    );
  }

  const status = data.subscription_status;
  const nextDate = data.next_billing_date
    ? format(new Date(data.next_billing_date), "dd/MM/yyyy", { locale: ptBR })
    : null;
  const lastSync = data.last_synced_at
    ? format(new Date(data.last_synced_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader title="Assinatura" description="Situação da sua conta no SIGESS." />

      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plano</p>
            <p className="text-lg font-semibold">{data.plan_name ?? "—"}</p>
          </div>
          {status && (
            <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          )}
        </div>

        {nextDate && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Próxima renovação
            </p>
            <p className="text-sm">{nextDate}</p>
          </div>
        )}

        {data.next_plan_name && (
          <div className="rounded-md border border-border/50 bg-secondary/20 px-3 py-2 text-sm text-foreground">
            Plano agendado: <strong>{data.next_plan_name}</strong>
            {data.next_plan_effective_date && (
              <span className="text-muted-foreground">
                {' · a partir de '}
                {format(new Date(data.next_plan_effective_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
        )}

        {data.has_pending_charge && data.payment_url && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Há uma cobrança pendente
                {data.pending_charge_amount != null && (
                  <span> — {formatCurrency(data.pending_charge_amount)}</span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => window.open(data.payment_url!, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Ir para pagamento
            </Button>
          </div>
        )}

        {lastSync && (
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground">
              Última sincronização: {lastSync}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Atualizar
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
