import { ExternalLink, Loader2, RefreshCw, CreditCard, Calendar, AlertCircle, Users, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { useBillingSummary } from "../hooks/data/useBillingSummary";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/modules/members/services/memberService";
import { memberQueryKeys } from "@/modules/members/queryKeys";
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BillingTab() {
  const { data, isLoading: loadingBilling, isError, refetch } = useBillingSummary();
  const { metadata, loading: loadingMeta } = useUserMetadata();
  const { tenantId, bootstrapped } = useActiveScope();

  const { data: countData, isLoading: loadingCount } = useQuery({
    queryKey: [...memberQueryKeys.count(null), "tenant", tenantId],
    queryFn: () => memberService.countMembers({ tenantId, unitId: null }),
    enabled: bootstrapped && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingBilling || loadingMeta || loadingCount;

  const maxSocios = (metadata?.max_socios ?? 0) > 0 ? metadata!.max_socios! : null;
  const currentCount = countData?.total ?? 0;
  const progress = maxSocios ? Math.min((currentCount / maxSocios) * 100, 100) : 0;
  const isAtLimit = maxSocios !== null && currentCount >= maxSocios;
  const isNearLimit = maxSocios !== null && !isAtLimit && currentCount >= maxSocios * 0.9;

  const expiraEm = metadata?.acesso_expira_em ?? null;
  const isExpired = metadata?.isExpired ?? false;
  const daysLeft = expiraEm
    ? Math.ceil((new Date(expiraEm).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const nextBilling = data?.next_billing_date ? formatDate(data.next_billing_date) : null;
  const nextBillingLabel = data?.subscription_status === "active" ? "Próxima cobrança" : "Vencimento";

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

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Expiração do acesso
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{formatDate(expiraEm)}</span>
              {isExpired && (
                <StatusBadge variant="destructive" label="Expirado" />
              )}
              {!isExpired && daysLeft !== null && daysLeft <= 30 && (
                <StatusBadge
                  variant={daysLeft <= 7 ? "destructive" : "warning"}
                  label={`${daysLeft}d`}
                />
              )}
            </div>
          </div>

          {nextBilling && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {nextBillingLabel}
              </p>
              <span className="text-sm font-medium">{nextBilling}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Progresso de socios */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Sócios cadastrados
          </p>
          <span className="text-sm tabular-nums">
            <span className={isAtLimit ? "text-destructive font-semibold" : "font-semibold"}>
              {currentCount.toLocaleString("pt-BR")}
            </span>
            {maxSocios !== null && (
              <span className="text-muted-foreground"> / {maxSocios.toLocaleString("pt-BR")}</span>
            )}
          </span>
        </div>

        {maxSocios !== null ? (
          <>
            <Progress
              value={progress}
              className={
                isAtLimit
                  ? "[&>div]:bg-destructive"
                  : isNearLimit
                  ? "[&>div]:bg-amber-500"
                  : ""
              }
            />
            {isAtLimit && (
              <p className="text-xs text-destructive">
                Limite atingido. Novos cadastros estão bloqueados.
              </p>
            )}
            {isNearLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Você está próximo do limite do plano.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Sem limite configurado.</p>
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

      {!data?.has_pending_charge && data?.subscription_status === "active" && (
        <p className="text-sm text-muted-foreground px-1">Nenhuma cobrança pendente.</p>
      )}

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
