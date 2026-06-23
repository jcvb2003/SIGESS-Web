import { useState } from "react";
import { Check, Smartphone, Calendar, Hash } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/shared/lib/utils";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { FinanceLancamento, FinanceDAE } from "../../types/finance.types";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS
} from "./constants";

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function buildAggregatedDescription(lancamentos: FinanceLancamento[]): string {
  const withComp = lancamentos.filter((l) => l.competencia_mes && l.competencia_ano);
  if (withComp.length === 0) return "Serviços prestados";

  const sorted = [...withComp].sort(
    (a, b) => (a.competencia_ano! * 12 + a.competencia_mes!) - (b.competencia_ano! * 12 + b.competencia_mes!)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstName = MONTH_NAMES[(first.competencia_mes ?? 1) - 1];
  const lastName = MONTH_NAMES[(last.competencia_mes ?? 1) - 1];

  if (first.competencia_mes === last.competencia_mes && first.competencia_ano === last.competencia_ano) {
    return `Mensalidades ref. competência de ${firstName} de ${first.competencia_ano}`;
  }
  if (first.competencia_ano === last.competencia_ano) {
    return `Mensalidades ref. competências de ${firstName} a ${lastName} de ${first.competencia_ano}`;
  }
  return `Mensalidades ref. competências de ${firstName}/${first.competencia_ano} a ${lastName}/${last.competencia_ano}`;
}

interface FinanceReceiptContentProps {
  readonly lancamentos: FinanceLancamento[];
  readonly daes?: FinanceDAE[];
  readonly memberName?: string;
  readonly memberCpf?: string;
}

export function FinanceReceiptContent({
  lancamentos,
  daes = [],
  memberName,
  memberCpf,
}: FinanceReceiptContentProps) {
  const [model, setModel] = useState<0 | 1>(0);
  const totalLancamentos = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalDAEs = daes.reduce((sum, d) => sum + Number(d.valor), 0);
  const totalValue = totalLancamentos + totalDAEs;

  const firstLancamento = lancamentos[0] as FinanceLancamento | undefined;
  const firstDAE = daes[0] as FinanceDAE | undefined;
  const paymentDate = firstLancamento?.data_pagamento || firstDAE?.data_pagamento_boleto;
  const paymentMethod = firstLancamento?.forma_pagamento || "boleto";

  return (
    <div className="flex flex-col items-stretch gap-2 w-full">

      {/* Header Context */}
      <div className="text-center space-y-1 w-full">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Check className="h-2.5 w-2.5" />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Pagamento Confirmado</span>
        </div>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-tight">Recibo de Atendimento</h2>
      </div>

      {/* Member Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card px-3 py-2 w-full">
        <div className="absolute top-0 right-0 w-20 h-20 bg-muted/15 rotate-45 translate-x-10 -translate-y-10" />
        <div className="relative flex items-center gap-3">
          {/* Nome */}
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Sócio Beneficiário</p>
            <p className="text-[11px] font-semibold text-foreground truncate">{memberName ?? "—"}</p>
          </div>
          {/* Divisor */}
          <div className="w-px h-8 bg-border flex-shrink-0" />
          {/* CPF */}
          <div className="flex-shrink-0">
            <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">CPF</p>
            <p className="text-[10px] text-foreground/80 font-medium">{memberCpf ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Descrição do Serviço</span>
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Valor</span>
        </div>

        {/* Seletor de modelo */}
        <div className="flex justify-center gap-1.5 py-0.5">
          {([0, 1] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setModel(i)}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all",
                model === i ? "bg-primary" : "bg-muted-foreground/30"
              )}
              aria-label={i === 0 ? "Detalhado" : "Resumido"}
            />
          ))}
        </div>

        <div className="border-y border-dashed border-border/60 py-1.5 space-y-1 w-full">
          {model === 0 ? (
            <>
              {lancamentos.map((l) => (
                <div key={l.id} className="flex justify-between items-baseline gap-2 w-full">
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-foreground/90">
                      {(l.tipo ? PAYMENT_TYPE_LABELS[l.tipo] : "") || l.tipo}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {(() => {
                        if (l.competencia_mes && l.competencia_ano)
                          return `Ref: ${String(l.competencia_mes).padStart(2, "0")}/${l.competencia_ano}`;
                        if (l.competencia_ano)
                          return `Ref: ${l.competencia_ano}`;
                        // Sem competência: mostrar descrição da cobrança (ex: "REAP 2025")
                        return l.descricao || "—";
                      })()}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-foreground">
                    {formatCurrency(Number(l.valor))}
                  </span>
                </div>
              ))}
              {daes.map((d) => (
                <div key={d.id} className="flex justify-between items-baseline gap-2 w-full">
                  <div className="flex-1">
                    <p className="text-[10px] font-medium text-foreground/90">Repasse DAE</p>
                    <p className="text-[9px] text-muted-foreground">
                      Ref: {String(d.competencia_mes).padStart(2, "0")}/{d.competencia_ano}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-foreground">
                    {formatCurrency(Number(d.valor))}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="flex justify-between items-baseline gap-2 w-full">
              <p className="text-[10px] font-medium text-foreground/90 flex-1">
                {buildAggregatedDescription(lancamentos)}
              </p>
              <span className="text-[10px] font-semibold text-foreground shrink-0">
                {formatCurrency(totalLancamentos)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total Section */}
      <div className="flex items-center justify-between bg-card border border-primary/50 rounded-xl px-3 py-2 w-full">
        <div className="space-y-0.5">
          <p className="text-[8px] font-semibold text-primary uppercase tracking-wide">Total Recebido</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-medium text-primary/80 uppercase">R$</span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(totalValue).replace("R$", "").trim()}
            </span>
          </div>
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Check className="h-5 w-5 stroke-[3]" />
        </div>
      </div>

      {/* Metadata — 4 colunas em linha única: Pagamento | Efetivado | Protocolo | QR Code */}
      <div className="grid grid-cols-4 items-start gap-x-2 px-1 py-1 w-full">

        {/* Col 1: Pagamento */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Smartphone className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="text-[8px] font-medium uppercase tracking-wide">Pagamento</span>
          </div>
          <p className="text-[9px] font-medium text-foreground/80">
            {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </p>
        </div>

        {/* Col 2: Efetivado */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="text-[8px] font-medium uppercase tracking-wide">Efetivado</span>
          </div>
          <p className="text-[9px] font-medium text-foreground/80">
            {paymentDate ? formatDate(paymentDate) : "—"}
          </p>
        </div>

        {/* Col 3: Protocolo */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Hash className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="text-[8px] font-medium uppercase tracking-wide">Protocolo</span>
          </div>
          <p className="text-[9px] font-medium text-muted-foreground break-all">
            {firstLancamento?.sessao_id?.slice(0, 12).toUpperCase() ?? "—"}
          </p>
        </div>

        {/* Col 4: QR Code */}
        <div className="flex justify-end">
          <div className="h-16 w-16 border border-border rounded p-0.5 bg-white shadow-sm flex-shrink-0">
            <QRCodeSVG
              value={`PROT: ${firstLancamento?.sessao_id?.slice(0, 12).toUpperCase() ?? "—"}\nCPF: ${memberCpf ?? "—"}\nTOTAL: ${formatCurrency(totalValue)}`}
              size={256}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Rodapé — abaixo da linha pontilhada */}
      <div className="border-t border-dashed border-border pt-2 text-center w-full">
        <p className="text-[8px] text-muted-foreground">
          Documento emitido eletronicamente via SIGESS
        </p>
      </div>

    </div>
  );
}
