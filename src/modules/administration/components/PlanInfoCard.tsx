import { CalendarClock, Users, ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { CardHeader, CardTitle } from "@/shared/components/ui/card";
import { SectionCard } from "@/shared/components/ui/SectionCard";
import { SectionLabel } from "@/shared/components/ui/SectionLabel";
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
    <SectionCard>
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
      <div className="border-t border-border/10 px-6 pt-4 pb-5">
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Status</SectionLabel>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : isExpired ? (
              <StatusBadge variant="destructive" icon={XCircle} label="Expirado" />
            ) : (
              <StatusBadge variant="success" icon={CheckCircle2} label="Ativo" />
            )}
          </div>

          {/* Expiracao */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel>
              <CalendarClock className="h-3.5 w-3.5" />
              Expiracao
            </SectionLabel>
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
            <SectionLabel>
              <Users className="h-3.5 w-3.5" />
              Limite de socios
            </SectionLabel>
            {loading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <span className="text-sm font-medium">
                {maxSocios !== null ? maxSocios.toLocaleString("pt-BR") : "—"}
              </span>
            )}
          </div>

        </div>
      </div>
    </SectionCard>
  );
}
