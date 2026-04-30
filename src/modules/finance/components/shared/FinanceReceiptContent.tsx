import { Check, Smartphone, Calendar, Hash } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { FinanceLancamento, FinanceDAE } from "../../types/finance.types";
import { 
  PAYMENT_METHOD_LABELS, 
  PAYMENT_TYPE_LABELS 
} from "./constants";

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
  const totalLancamentos = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalDAEs = daes.reduce((sum, d) => sum + Number(d.valor), 0);
  const totalValue = totalLancamentos + totalDAEs;

  const firstLancamento = lancamentos[0] as FinanceLancamento | undefined;
  const firstDAE = daes[0] as FinanceDAE | undefined;
  const paymentDate = firstLancamento?.data_pagamento || firstDAE?.data_pagamento_boleto;
  const paymentMethod = firstLancamento?.forma_pagamento || "boleto";

  return (
    <div className="flex flex-col items-stretch gap-4 w-full">
      {/* Header Context */}
      <div className="text-center space-y-1 w-full">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Check className="h-2.5 w-2.5" />
          <span className="text-[9px] font-black uppercase tracking-widest">Pagamento Confirmado</span>
        </div>
        <h2 className="text-sm font-black text-foreground uppercase tracking-tighter">Recibo de Atendimento</h2>
      </div>

      {/* Member Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-3 w-full">
        <div className="absolute top-0 right-0 w-16 h-16 bg-muted/20 rotate-45 translate-x-8 -translate-y-8" />
        <div className="relative space-y-2">
          <div>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Sócio Beneficiário</p>
            <p className="text-sm font-black text-foreground leading-none">{memberName ?? "—"}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">CPF</p>
            <p className="text-[10px] font-bold text-foreground/80">{memberCpf ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Descrição do Serviço</span>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Valor</span>
        </div>
        
        <div className="border-y border-dashed border-border/60 py-2 space-y-1.5 w-full">
          {lancamentos.map((l) => (
            <div key={l.id} className="flex justify-between items-baseline gap-2 w-full">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-foreground/90 leading-tight">
                  {(l.tipo ? PAYMENT_TYPE_LABELS[l.tipo] : "") || l.tipo}
                </p>
                <p className="text-[8px] font-medium text-muted-foreground">
                  Ref: {l.competencia_mes ? `${String(l.competencia_mes).padStart(2, "0")}/` : ""}{l.competencia_ano || "—"}
                </p>
              </div>
              <span className="text-[10px] font-black text-foreground">
                {formatCurrency(Number(l.valor))}
              </span>
            </div>
          ))}
          {daes.map((d) => (
            <div key={d.id} className="flex justify-between items-baseline gap-2 w-full">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-foreground/90 leading-tight">Repasse DAE</p>
                <p className="text-[8px] font-medium text-muted-foreground">
                  Ref: {String(d.competencia_mes).padStart(2, "0")}/{d.competencia_ano}
                </p>
              </div>
              <span className="text-[10px] font-black text-foreground">
                {formatCurrency(Number(d.valor))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total Section */}
      <div className="relative w-full">
        <div className="flex items-center justify-between bg-card border-2 border-primary rounded-xl p-3 w-full">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Total Recebido</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold text-primary/60 uppercase">R$</span>
              <span className="text-2xl font-black text-foreground tracking-tighter">
                {formatCurrency(totalValue).replace("R$", "").trim()}
              </span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Check className="h-6 w-6 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1 py-2 w-full">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Smartphone className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase tracking-wider">Pagamento</span>
          </div>
          <p className="text-[10px] font-bold text-foreground/80">
            {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase tracking-wider">Efetivado</span>
          </div>
          <p className="text-[10px] font-bold text-foreground/80">
            {paymentDate ? formatDate(paymentDate) : "—"}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase tracking-wider">Protocolo</span>
          </div>
          <p className="text-[9px] font-mono font-bold text-muted-foreground">
            {firstLancamento?.sessao_id?.slice(0, 12).toUpperCase() ?? "—"}
          </p>
        </div>
        <div className="flex flex-col items-end justify-end">
           <div className="h-24 w-24 border border-border rounded p-0.5 bg-white shadow-sm">
              <QRCodeSVG
                value={`PROT: ${firstLancamento?.sessao_id?.slice(0, 12).toUpperCase() ?? "—"}\nCPF: ${memberCpf ?? "—"}\nTOTAL: ${formatCurrency(totalValue)}`}
                size={256}
                className="h-full w-full object-contain"
              />
           </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border text-center space-y-1 w-full">
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
          Documento gerado eletronicamente via SIGESS
        </p>
        <p className="text-[7px] text-muted-foreground/60 font-medium italic">
          Este recibo comprova a quitação dos débitos acima listados.
        </p>
      </div>
    </div>
  );
}
