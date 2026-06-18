import { CreditCard, ExternalLink, RefreshCw, Users, CalendarClock, ShieldCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { useBillingSummary } from "@/modules/billing/hooks/data/useBillingSummary";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "@/modules/members/services/memberService";
import { memberQueryKeys } from "@/modules/members/queryKeys";

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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(new Date(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
  );
}

export default function SubscriptionPage() {
  const { data: billing, isLoading: loadingBilling, isError, refetch } = useBillingSummary();
  const { metadata, loading: loadingMeta } = useUserMetadata();
  const { tenantId, bootstrapped } = useActiveScope();

  const { data: countData, isLoading: loadingCount } = useQuery({
    queryKey: [...memberQueryKeys.count(null), "tenant", tenantId],
    queryFn: () => memberService.countMembers({ tenantId, unitId: null }),
    enabled: bootstrapped && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingBilling || loadingMeta || loadingCount;

  const maxSocios = metadata?.max_socios ?? null;
  const currentCount = countData?.total ?? 0;
  const progress = maxSocios ? Math.min((currentCount / maxSocios) * 100, 100) : 0;
  const isNearLimit = maxSocios !== null && currentCount >= maxSocios * 0.9;
  const isAtLimit = maxSocios !== null && currentCount >= maxSocios;

  const expiraEm = metadata?.acesso_expira_em ?? null;
  const isExpired = metadata?.isExpired ?? false;
  const daysLeft = expiraEm
    ? Math.ceil((new Date(expiraEm).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const status = billing?.subscription_status;
  const nextDate = billing?.next_billing_date;
  const lastSync = billing?.last_synced_at
    ? format(new Date(billing.last_synced_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Assinatura"
        description="Situação da sua conta no SIGESS."
      />

      {isError && (
        <Card className="p-5 text-sm text-destructive border-destructive/30">
          Erro ao carregar dados de cobrança. Os dados do plano ainda são exibidos abaixo.
        </Card>
      )}

      {/* Plano e status */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <SectionLabel>Plano</SectionLabel>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <p className="text-lg font-semibold">{billing?.plan_name ?? "—"}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isExpired ? (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-primary" />
            )}
            {status && !isLoading && (
              <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
                {STATUS_LABELS[status] ?? status}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 pt-2 border-t border-border/30">
          {/* Expiracao do acesso */}
          <div className="space-y-1.5">
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 inline" />
                Expiração do acesso
              </span>
            </SectionLabel>
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{formatDate(expiraEm)}</span>
                {daysLeft !== null && !isExpired && daysLeft <= 30 && (
                  <Badge variant={daysLeft <= 7 ? "destructive" : "outline"} className="text-xs">
                    {daysLeft}d restantes
                  </Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive" className="text-xs">Expirado</Badge>
                )}
              </div>
            )}
          </div>

          {/* Proxima renovacao */}
          <div className="space-y-1.5">
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 inline" />
                Próxima renovação
              </span>
            </SectionLabel>
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <span className="text-sm font-medium">{formatDate(nextDate)}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Progresso de socios */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <SectionLabel>Sócios cadastrados</SectionLabel>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <span className="text-sm font-semibold tabular-nums">
              {currentCount.toLocaleString("pt-BR")}
              {maxSocios !== null && (
                <span className="text-muted-foreground font-normal">
                  {" "}/ {maxSocios.toLocaleString("pt-BR")}
                </span>
              )}
            </span>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-2 w-full rounded-full" />
        ) : maxSocios !== null ? (
          <>
            <Progress
              value={progress}
              className={isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-amber-500" : ""}
            />
            {isAtLimit && (
              <p className="text-xs text-destructive font-medium">
                Limite atingido. Novos cadastros estão bloqueados.
              </p>
            )}
            {isNearLimit && !isAtLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Você está próximo do limite do plano.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Limite não configurado.</p>
        )}
      </Card>

      {/* Cobrança pendente */}
      {billing?.has_pending_charge && billing.payment_url && (
        <Card className="p-5 border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Há uma cobrança pendente
              {billing.pending_charge_amount != null && (
                <span> — {formatCurrency(billing.pending_charge_amount)}</span>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
            onClick={() => window.open(billing.payment_url!, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Ir para pagamento
          </Button>
        </Card>
      )}

      {/* Rodape */}
      {lastSync && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Última sincronização: {lastSync}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3" />
            Atualizar
          </Button>
        </div>
      )}
    </div>
  );
}
