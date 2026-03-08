import { forwardRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Printer, X, Fish, Check, FileText } from "lucide-react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { FinanceLancamento, FinanceDAE } from "../../types/finance.types";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { EntitySettings } from "@/shared/types/entity.types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  transferencia: "Transferência",
  boleto: "Boleto",
  cartao: "Cartão",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  anuidade: "Anuidade",
  mensalidade: "Mensalidade",
  inicial: "Inicial",
  transferencia: "Transferência",
  contribuicao: "Contribuição",
  cadastro_governamental: "Cadastro Governamental",
};

interface SessionReceiptDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly lancamentos: FinanceLancamento[];
  readonly daes?: FinanceDAE[];
  readonly memberName?: string;
  readonly memberCpf?: string;
}

const ReceiptContent = forwardRef<HTMLDivElement, {
  readonly lancamentos: FinanceLancamento[];
  readonly daes?: FinanceDAE[];
  readonly memberName?: string;
  readonly memberCpf?: string;
  readonly entity: EntitySettings | null | undefined;
}>(function ReceiptContent({ lancamentos, daes = [], memberName, memberCpf, entity }, ref) {
  if (lancamentos.length === 0 && daes.length === 0) return null;

  const firstLancamento = lancamentos[0] as FinanceLancamento | undefined;
  const firstDAE = daes[0] as FinanceDAE | undefined;
  
  const totalLancamentos = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalDAEs = daes.reduce((sum, d) => sum + Number(d.valor), 0);
  const totalValue = totalLancamentos + totalDAEs;

  const paymentDate = firstLancamento?.data_pagamento || firstDAE?.data_pagamento_boleto;
  const paymentMethod = firstLancamento?.forma_pagamento || "boleto";

  return (
    <div
      ref={ref}
      className="bg-white p-6 space-y-4 text-sm print:text-xs print:p-2"
      id="receipt-content"
    >
      {/* Header */}
      <div className="text-center border-b pb-4 space-y-1">
        <div className="flex justify-center mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <Fish className="h-6 w-6" />
          </div>
        </div>
        <h2 className="font-bold text-lg leading-tight uppercase">
          {entity?.shortName || entity?.name || "SIGESS"}
        </h2>
        {entity?.cnpj && (
          <p className="text-[10px] text-muted-foreground font-medium">
            CNPJ: {entity.cnpj}
          </p>
        )}
        <p className="text-[9px] text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
          {entity?.street &&
            `${entity.street}, ${entity.number} - ${entity.district}, ${entity.city}/${entity.state}`}
        </p>
        <div className="mt-2 pt-2 border-t border-dashed border-muted">
          <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-600">
            Comprovante de Pagamento
          </p>
        </div>
      </div>

      {/* Member Info */}
      <div className="border rounded-lg p-3 bg-muted/20 border-slate-100">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
          Sócio
        </p>
        <p className="text-sm font-semibold text-slate-800">{memberName ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          CPF: {memberCpf ?? "—"}
        </p>
      </div>

      {/* Items */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2 px-1">
          Descrição dos Itens
        </p>
        <div className="space-y-1 bg-white rounded-lg border border-slate-100 divide-y divide-dashed divide-slate-100 overflow-hidden">
          {lancamentos.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between p-2.5 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-medium text-slate-600">
                  {(l.tipo ? PAYMENT_TYPE_LABELS[l.tipo] : "") || l.tipo}
                  {l.competencia_ano && ` — ${l.competencia_ano}`}
                  {l.competencia_mes && `/${String(l.competencia_mes).padStart(2, "0")}`}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                {formatCurrency(Number(l.valor))}
              </span>
            </div>
          ))}
          {daes.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-2.5 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-medium text-slate-600">
                  Repasse DAE — {String(d.competencia_mes).padStart(2, "0")}/{d.competencia_ano}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                {formatCurrency(Number(d.valor))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-600 p-4 shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-700">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-50">
          Total Pago
        </span>
        <span className="text-xl font-black text-white tracking-tighter">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/30">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Forma de pagamento</p>
          <p className="text-[11px] font-bold text-slate-700">
            {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Data do pagamento</p>
          <p className="text-[11px] font-bold text-slate-700">
            {paymentDate ? formatDate(paymentDate) : "—"}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Emissão</p>
          <p className="text-[11px] font-bold text-slate-700">
            {formatDate(new Date().toISOString())}
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Sessão ID</p>
          <p className="font-mono text-[9px] text-slate-500 font-medium">
            {firstLancamento?.sessao_id?.slice(0, 8) ?? "—"}...
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t border-dashed pt-4 space-y-1">
        <p className="text-[10px] font-bold text-slate-400">Este documento é um comprovante de pagamento válido.</p>
        <p className="text-[9px] text-slate-300">Gerado pelo SIGESS em {new Date().toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
});

export function SessionReceiptDialog({
  open,
  onOpenChange,
  lancamentos,
  daes,
  memberName,
  memberCpf,
}: SessionReceiptDialogProps) {
  const { entity } = useEntityData();

  const handlePrint = useCallback(() => {
    const content = document.getElementById("receipt-content");
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlHead = `
      <title>Comprovante de Pagamento</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 5mm; 
          width: 80mm; 
          margin: 0;
          background: #fff;
          color: #000;
        }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5mm; margin-bottom: 5mm; }
        .header h2 { font-size: 14pt; font-weight: 800; text-transform: uppercase; margin-bottom: 1mm; }
        .header p { font-size: 9pt; color: #333; margin-top: 0.5mm; line-height: 1.2; }
        .section { margin-bottom: 4mm; }
        .section-title { font-size: 8pt; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #ddd; margin-bottom: 2mm; padding-bottom: 0.5mm; }
        .member-box { border: 1px solid #ccc; padding: 3mm; margin-bottom: 4mm; }
        .member-box .name { font-weight: 700; font-size: 11pt; }
        .member-box .cpf { font-size: 9pt; }
        .item { display: flex; justify-content: space-between; padding: 1.5mm 0; border-bottom: 1px dashed #eee; font-size: 10pt; }
        .item:last-child { border-bottom: none; }
        .total { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border: 2px solid #000; 
          padding: 3mm; 
          font-weight: 800; 
          margin: 5mm 0; 
        }
        .total .label { font-size: 9pt; text-transform: uppercase; }
        .total .value { font-size: 16pt; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; font-size: 9pt; }
        .details div { margin-bottom: 1mm; }
        .details .label { color: #666; font-size: 8pt; }
        .details .value { font-weight: 700; display: block; }
        .footer { 
          text-align: center; 
          border-top: 1px solid #000; 
          padding-top: 4mm; 
          margin-top: 5mm;
          font-size: 8pt; 
          line-height: 1.4;
        }
        @media print {
          body { width: 100%; padding: 3mm; }
          button, .no-print { display: none; }
        }
      </style>
    `;

    printWindow.document.head.innerHTML = htmlHead;
    printWindow.document.body.innerHTML = content.innerHTML;
    printWindow.document.close();

    // Small delay to ensure styles are applied before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 outline-none [&>button]:hidden overflow-hidden transition-all duration-300">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <FileText className="h-5 w-5" />
              <DialogTitle className="text-xl font-bold tracking-tight">
                Comprovante
              </DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-2 font-bold border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1 px-0.5">
            Documento de validação de pagamento de sessão
          </p>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide bg-slate-50/30">
          <ReceiptContent
            lancamentos={lancamentos}
            daes={daes}
            memberName={memberName}
            memberCpf={memberCpf}
            entity={entity}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
