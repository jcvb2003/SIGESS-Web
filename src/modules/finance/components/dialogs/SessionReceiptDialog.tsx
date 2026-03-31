import { forwardRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Printer, X, Fish, Check } from "lucide-react";
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
  inscricao: "Inscrição",
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
          <p className="text-[10px] font-bold tracking-widest uppercase">
            Comprovante de Pagamento
          </p>
        </div>
      </div>

      {/* Member Info */}
      <div className="border rounded-lg p-3 bg-muted/20">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
          Sócio
        </p>
        <p className="font-semibold">{memberName ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          CPF: {memberCpf ?? "—"}
        </p>
      </div>

      {/* Items */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
          Itens
        </p>
        <div className="space-y-1.5">
          {lancamentos.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0"
            >
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-xs">
                  {PAYMENT_TYPE_LABELS[l.tipo] ?? l.tipo}
                  {l.competencia_ano && ` — ${l.competencia_ano}`}
                  {l.competencia_mes && `/${String(l.competencia_mes).padStart(2, "0")}`}
                </span>
              </div>
              <span className="text-xs font-semibold">
                {formatCurrency(Number(l.valor))}
              </span>
            </div>
          ))}
          {daes.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0"
            >
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-xs">
                  Repasse DAE — {String(d.competencia_mes).padStart(2, "0")}/{d.competencia_ano}
                </span>
              </div>
              <span className="text-xs font-semibold">
                {formatCurrency(Number(d.valor))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3">
        <span className="text-xs font-bold uppercase text-emerald-700">
          Total pago
        </span>
        <span className="text-lg font-bold text-emerald-700">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Forma de pagamento</p>
          <p className="font-semibold">
            {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Data do pagamento</p>
          <p className="font-semibold">
            {paymentDate ? formatDate(paymentDate) : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Sessão ID</p>
          <p className="font-mono text-[10px]">
            {firstLancamento?.sessao_id ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Emissão</p>
          <p className="font-semibold">
            {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t pt-3 text-[10px] text-muted-foreground">
        <p>Este documento é um comprovante de pagamento válido.</p>
        <p>Gerado pelo SIGESS em {new Date().toLocaleString("pt-BR")}</p>
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
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm">Comprovante</DialogTitle>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handlePrint}
              >
                <Printer className="h-3 w-3" />
                Imprimir
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
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
