import { CalendarClock, Users, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function PlanInfoCard() {
  const { metadata, loading } = useUserMetadata();

  const isExpired = metadata?.isExpired ?? false;
  const expiraEm = metadata?.acesso_expira_em ?? null;
  const maxSocios = metadata?.max_socios ?? null;

  const daysLeft = expiraEm
    ? Math.ceil((new Date(expiraEm).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isExpired ? (
            <ShieldAlert className="h-5 w-5 text-destructive" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-primary" />
          )}
          Plano e acesso
        </CardTitle>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-4">
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : isExpired ? (
              <StatusBadge variant="destructive" label="Expirado" />
            ) : (
              <StatusBadge variant="success" label="Ativo" />
            )}
          </div>

          {/* Expiracao */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Expiracao
            </span>
            {loading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{formatDate(expiraEm)}</span>
                {daysLeft !== null && !isExpired && daysLeft <= 30 && (
                  <StatusBadge
                    variant={daysLeft <= 7 ? "destructive" : "warning"}
                    label={`${daysLeft}d restantes`}
                  />
                )}
              </div>
            )}
          </div>

          {/* Limite de socios */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Limite de socios
            </span>
            {loading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span className="text-sm font-medium">
                {maxSocios !== null ? maxSocios.toLocaleString("pt-BR") : "—"}
              </span>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
