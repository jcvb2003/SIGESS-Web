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
import type { FinanceLancamento } from "../../types/finance.types";

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
  readonly memberName?: string;
  readonly memberCpf?: string;
  readonly colonyName?: string;
}

const ReceiptContent = forwardRef<HTMLDivElement, {
  readonly lancamentos: FinanceLancamento[];
  readonly memberName?: string;
  readonly memberCpf?: string;
  readonly colonyName?: string;
}>(function ReceiptContent({ lancamentos, memberName, memberCpf, colonyName }, ref) {
  if (lancamentos.length === 0) return null;

  const firstLancamento = lancamentos[0];
  const totalValue = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
  const paymentDate = firstLancamento.data_pagamento;
  const paymentMethod = firstLancamento.forma_pagamento;

  return (
    <div
      ref={ref}
      className="bg-white p-6 space-y-4 text-sm print:text-xs print:p-2"
      id="receipt-content"
    >
      {/* Header */}
      <div className="text-center border-b pb-4">
        <div className="flex justify-center mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Fish className="h-5 w-5" />
          </div>
        </div>
        <h2 className="font-bold text-base">SIGESS</h2>
        <p className="text-xs text-muted-foreground">
          {colonyName ?? "Colônia de Pescadores"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          COMPROVANTE DE PAGAMENTO
        </p>
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
            {firstLancamento.sessao_id ?? "—"}
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
  memberName,
  memberCpf,
  colonyName,
}: SessionReceiptDialogProps) {
  const handlePrint = useCallback(() => {
    const content = document.getElementById("receipt-content");
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Pagamento</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
          .header h2 { font-size: 16px; font-weight: 700; }
          .header p { font-size: 11px; color: #64748b; margin-top: 2px; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; }
          .member-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #fafafa; }
          .member-box .name { font-weight: 600; font-size: 13px; }
          .member-box .cpf { font-size: 11px; color: #64748b; }
          .item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; }
          .item:last-child { border-bottom: none; }
          .total { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px; font-weight: 700; margin: 12px 0; }
          .total .label { font-size: 11px; text-transform: uppercase; color: #047857; }
          .total .value { font-size: 16px; color: #047857; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
          .details p { margin: 0; }
          .details .label { color: #94a3b8; }
          .details .value { font-weight: 600; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; }
          @media print { body { padding: 8px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
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

        <div className="max-h-[70vh] overflow-y-auto">
          <ReceiptContent
            lancamentos={lancamentos}
            memberName={memberName}
            memberCpf={memberCpf}
            colonyName={colonyName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
