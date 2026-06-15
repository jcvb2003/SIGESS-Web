import { ExternalLink, Loader2, RefreshCw, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { useBillingSummary } from "../hooks/data/useBillingSummary";
import type { BillingSummaryRow } from "../types/billing.types";

// ─── Status mapping ───────────────────────────────────────────────────────────

type Status = BillingSummaryRow["subscription_status"];

const STATUS_LABEL: Record<NonNullable<Status>, string> = {
  trialing:        "Trial",
  pending_payment: "Aguardando pagamento",
  active:          "Ativo",
  overdue:         "Em atraso",
  cancelled:       "Cancelado",
};

const STATUS_VARIANT: Record<NonNullable<Status>, StatusBadgeVariant> = {
  active:          "success",
  trialing:        "info",
  pending_payment: "warning",
  overdue:         "destructive",
  cancelled:       "secondary",
};

function SubscriptionBadge({ status }: { status: Status }) {
  if (!status) return <StatusBadge variant="outline" label="Sem assinatura" />;
  return <StatusBadge variant={STATUS_VARIANT[status]} label={STATUS_LABEL[status]} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BillingTab() {
  const { data, isLoading, isError, refetch } = useBillingSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar as informações de assinatura.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </Card>
    );
  }

  const nextBilling = data?.next_billing_date
    ? format(new Date(data.next_billing_date), "dd/MM/yyyy", { locale: ptBR })
    : null;

  const nextBillingLabel =
    data?.subscription_status === "active" ? "Próxima cobrança" : "Vencimento";

  return (
    <div className="space-y-4 max-w-lg">
      {/* Status da assinatura */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Assinatura</p>
              {data?.plan_name && (
                <p className="text-xs text-muted-foreground">Plano {data.plan_name}</p>
              )}
            </div>
          </div>
          <SubscriptionBadge status={data?.subscription_status ?? null} />
        </div>

        {nextBilling && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {nextBillingLabel} em <span className="font-medium text-foreground">{nextBilling}</span>
            </span>
          </div>
        )}
      </Card>

      {/* Cobrança pendente */}
      {data?.has_pending_charge && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Cobrança pendente</p>
              {data.pending_charge_amount != null && (
                <p className="text-2xl font-semibold mt-0.5">
                  {formatCurrency(data.pending_charge_amount)}
                </p>
              )}
            </div>
          </div>

          {data.payment_url ? (
            <Button
              className="w-full"
              onClick={() => window.open(data.payment_url!, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Pagar agora
            </Button>
          ) : (
            <p className="text-xs text-center text-muted-foreground">
              Link de pagamento ainda não disponível. Entre em contato com o suporte.
            </p>
          )}
        </Card>
      )}

      {/* Ativo sem cobrança pendente */}
      {!data?.has_pending_charge && data?.subscription_status === "active" && (
        <p className="text-sm text-muted-foreground px-1">Nenhuma cobrança pendente.</p>
      )}

      {/* Sem dados de billing */}
      {!data && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma informação de assinatura disponível para esta entidade.
          </p>
        </Card>
      )}
    </div>
  );
}
