import { useParams } from "react-router-dom";
import { ExternalLink, Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { usePortalToken } from "@/modules/billing/hooks/data/usePortalToken";

export default function PaymentPortalPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = usePortalToken(token);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data || !data.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm p-8 text-center space-y-3">
          <XCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-lg font-semibold">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground">
            {!data || !data.ok
              ? (data as { ok: false; reason: string } | null)?.reason === "token_expired"
                ? "Este link de pagamento expirou."
                : "Este link de pagamento não é válido."
              : "Ocorreu um erro inesperado."}
          </p>
        </Card>
      </div>
    );
  }

  const dueDate = data.due_date
    ? format(new Date(data.due_date), "dd/MM/yyyy", { locale: ptBR })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Portal de pagamento
          </p>
          <h1 className="text-xl font-bold">{data.tenant_name ?? "SIGESS"}</h1>
          {data.plan_name && (
            <p className="text-sm text-muted-foreground">Plano {data.plan_name}</p>
          )}
        </div>

        <div className="rounded-md border border-border/60 bg-secondary/20 p-4 space-y-3">
          {data.amount != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-semibold">{formatCurrency(data.amount)}</span>
            </div>
          )}
          {dueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vencimento</span>
              <span>{dueDate}</span>
            </div>
          )}
        </div>

        {data.payment_url ? (
          <Button
            className="w-full"
            onClick={() => window.open(data.payment_url!, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Acessar boleto
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Link de pagamento não disponível. Entre em contato com o suporte.
          </p>
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          Este link é válido por tempo limitado.
        </p>
      </Card>
    </div>
  );
}
