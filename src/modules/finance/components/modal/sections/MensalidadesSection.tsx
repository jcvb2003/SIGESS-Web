import { useMemo } from "react";
import { ExternalLink, RefreshCw, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { FinanceLancamento } from "../../../types/finance.types";
import type { ExternalCharge } from "../../../services/externalChargeService";

const MONTH_LABELS = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const FCX_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  cancelada: "Cancelada",
  expirada: "Expirada",
  falha: "Falha",
};

const FCX_STATUS_CLASS: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  paga: "bg-success/10 text-success border-success/20",
  cancelada: "bg-muted text-muted-foreground",
  expirada: "bg-destructive/10 text-destructive border-destructive/20",
  falha: "bg-destructive/10 text-destructive border-destructive/20",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  transferencia: "Transferência",
  boleto: "Boleto",
  cartao: "Cartão",
};

interface MensalidadesSectionProps {
  lancamentos: FinanceLancamento[];
  charges: ExternalCharge[];
  sync: (fcxId: string) => void;
  isSyncingId: (id: string) => boolean;
  reissue: (lancId: string, billing: "BOLETO" | "PIX", dueDate: string) => void;
  isReissuingLancId: (lancId: string) => boolean;
}

type CompKey = `${number}-${number}`;
type CompRow = {
  ano: number;
  mes: number;
  lancamentos: FinanceLancamento[];
  charges: ExternalCharge[];
};

const REISSUABLE = new Set(["falha", "expirada"]);

export function MensalidadesSection({
  lancamentos,
  charges,
  sync,
  isSyncingId,
  reissue,
  isReissuingLancId,
}: MensalidadesSectionProps) {
  const rows = useMemo<CompRow[]>(() => {
    const grouped = new Map<CompKey, CompRow>();

    for (const l of lancamentos) {
      if (!l.competencia_ano || !l.competencia_mes) continue;
      const key: CompKey = `${l.competencia_ano}-${l.competencia_mes}`;
      if (!grouped.has(key)) {
        grouped.set(key, { ano: l.competencia_ano, mes: l.competencia_mes, lancamentos: [], charges: [] });
      }
      grouped.get(key)!.lancamentos.push(l);
    }

    for (const c of charges) {
      if (!c.competencia_ano || !c.competencia_mes) continue;
      const key: CompKey = `${c.competencia_ano}-${c.competencia_mes}`;
      if (grouped.has(key)) grouped.get(key)!.charges.push(c);
    }

    return [...grouped.values()].sort((a, b) => (b.ano * 100 + b.mes) - (a.ano * 100 + a.mes));
  }, [lancamentos, charges]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider px-1 mb-2">
        Mensalidades
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <CompetenciaRow
            key={`${row.ano}-${row.mes}`}
            row={row}
            sync={sync}
            isSyncingId={isSyncingId}
            reissue={reissue}
            isReissuingLancId={isReissuingLancId}
          />
        ))}
      </div>
    </div>
  );
}

function CompetenciaRow({
  row,
  sync,
  isSyncingId,
  reissue,
  isReissuingLancId,
}: {
  row: CompRow;
  sync: (fcxId: string) => void;
  isSyncingId: (id: string) => boolean;
  reissue: (lancId: string, billing: "BOLETO" | "PIX", dueDate: string) => void;
  isReissuingLancId: (lancId: string) => boolean;
}) {
  // FCX mais recente não-cancelada
  const fcxAtiva = row.charges.find((c) => c.status !== "cancelada") ?? null;
  const pagoLanc = row.lancamentos.find((l) => l.status === "pago") ?? null;
  const pendenteLanc = row.lancamentos.find((l) => l.status === "pendente") ?? null;
  const canceladoLancs = row.lancamentos.filter((l) => l.status === "cancelado");

  const competenciaLabel = `${String(row.mes).padStart(2, "0")}/${row.ano}`;
  const mesLabel = MONTH_LABELS[row.mes] ?? String(row.mes);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3">
      {/* Competência */}
      <div className="flex flex-col items-center justify-center min-w-[40px] text-center">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{mesLabel}</span>
        <span className="text-[11px] font-bold text-foreground">{row.ano}</span>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {pagoLanc && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-success">Pago</span>
            {pagoLanc.data_pagamento && (
              <span className="text-[11px] text-muted-foreground">{formatDate(pagoLanc.data_pagamento)}</span>
            )}
            {pagoLanc.valor != null && (
              <span className="text-[11px] text-muted-foreground">{formatCurrency(pagoLanc.valor)}</span>
            )}
            {pagoLanc.forma_pagamento && (
              <span className="text-[11px] text-muted-foreground">
                {PAYMENT_METHOD_LABELS[pagoLanc.forma_pagamento] ?? pagoLanc.forma_pagamento}
              </span>
            )}
          </div>
        )}

        {!pagoLanc && pendenteLanc && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-600">Aguardando</span>
            {pendenteLanc.valor != null && (
              <span className="text-[11px] text-muted-foreground">{formatCurrency(pendenteLanc.valor)}</span>
            )}
          </div>
        )}

        {!pagoLanc && !pendenteLanc && canceladoLancs.length > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">Cancelado</span>
        )}

        {/* FCX badge inline */}
        {fcxAtiva && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-4 px-1">
              {fcxAtiva.provider}
            </Badge>
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border ${FCX_STATUS_CLASS[fcxAtiva.status] ?? "bg-muted text-muted-foreground"}`}>
              {FCX_STATUS_LABEL[fcxAtiva.status] ?? fcxAtiva.status}
            </span>
            {fcxAtiva.data_vencimento && (
              <span className="text-[10px] text-muted-foreground">Venc. {formatDate(fcxAtiva.data_vencimento)}</span>
            )}
            {fcxAtiva.status === "falha" && fcxAtiva.error_message && (
              <span
                className="text-[10px] text-destructive/80 truncate max-w-[160px]"
                title={fcxAtiva.error_message}
              >
                {fcxAtiva.error_message}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ações FCX */}
      {fcxAtiva && (
        <div className="flex gap-1 shrink-0">
          {fcxAtiva.payment_url && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={fcxAtiva.payment_url} target="_blank" rel="noopener noreferrer" title="Abrir cobrança">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => sync(fcxAtiva.id)}
            disabled={isSyncingId(fcxAtiva.id) || isReissuingLancId(fcxAtiva.lancamento_id)}
            title="Sincronizar status"
          >
            {isSyncingId(fcxAtiva.id)
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          {REISSUABLE.has(fcxAtiva.status) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-amber-600 hover:text-amber-700"
              onClick={() => {
                const dueDate = fcxAtiva.data_vencimento ?? new Date().toISOString().split("T")[0];
                reissue(fcxAtiva.lancamento_id, (fcxAtiva.billing_type as "BOLETO" | "PIX" | null) ?? "BOLETO", dueDate);
              }}
              disabled={isReissuingLancId(fcxAtiva.lancamento_id) || isSyncingId(fcxAtiva.id)}
              title="Reemitir cobrança"
            >
              {isReissuingLancId(fcxAtiva.lancamento_id)
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RotateCcw className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
