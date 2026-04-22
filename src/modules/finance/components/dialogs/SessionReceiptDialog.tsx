import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Printer, X, Check, FileText, Smartphone, Hash, Calendar } from "lucide-react";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { FinanceLancamento, FinanceDAE } from "../../types/finance.types";
import { PrintLayout } from "@/shared/components/print/PrintLayout";
import { usePrint } from "@/shared/hooks/usePrint";

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

export function SessionReceiptDialog({
  open,
  onOpenChange,
  lancamentos,
  daes = [],
  memberName,
  memberCpf,
}: SessionReceiptDialogProps) {
  const { print } = usePrint();

  const totalLancamentos = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalDAEs = daes.reduce((sum, d) => sum + Number(d.valor), 0);
  const totalValue = totalLancamentos + totalDAEs;

  const firstLancamento = lancamentos[0] as FinanceLancamento | undefined;
  const firstDAE = daes[0] as FinanceDAE | undefined;
  const paymentDate = firstLancamento?.data_pagamento || firstDAE?.data_pagamento_boleto;
  const paymentMethod = firstLancamento?.forma_pagamento || "boleto";

  const handlePrint = useCallback(() => {
    print("receipt-content");
  }, [print]);

  if (lancamentos.length === 0 && daes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 outline-none [&>button]:hidden overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-4 pt-6 pb-2 border-b flex-shrink-0 text-left">
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

        <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden scrollbar-hide bg-slate-50">
          <PrintLayout
            id="receipt-content"
            type="thermal"
            className="text-xs"
          >
            <div className="flex flex-col items-stretch gap-4 w-full">
              {/* Header Context */}
              <div className="text-center space-y-1 w-full">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Check className="h-2.5 w-2.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Pagamento Confirmado</span>
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Recibo de Atendimento</h2>
              </div>

              {/* Member Card */}
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 w-full">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rotate-45 translate-x-8 -translate-y-8" />
                <div className="relative space-y-2">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sócio Beneficiário</p>
                    <p className="text-sm font-black text-slate-800 leading-none">{memberName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">CPF</p>
                    <p className="text-[10px] font-bold text-slate-600">{memberCpf ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição do Serviço</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</span>
                </div>
                
                <div className="border-y border-dashed border-slate-300 py-2 space-y-1.5 w-full">
                  {lancamentos.map((l) => (
                    <div key={l.id} className="flex justify-between items-baseline gap-2 w-full">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-700 leading-tight">
                          {(l.tipo ? PAYMENT_TYPE_LABELS[l.tipo] : "") || l.tipo}
                        </p>
                        <p className="text-[8px] font-medium text-slate-400">
                          Ref: {l.competencia_mes ? `${String(l.competencia_mes).padStart(2, "0")}/` : ""}{l.competencia_ano || "—"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-slate-800">
                        {formatCurrency(Number(l.valor))}
                      </span>
                    </div>
                  ))}
                  {daes.map((d) => (
                    <div key={d.id} className="flex justify-between items-baseline gap-2 w-full">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-700 leading-tight">Repasse DAE</p>
                        <p className="text-[8px] font-medium text-slate-400">
                          Ref: {String(d.competencia_mes).padStart(2, "0")}/{d.competencia_ano}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-slate-800">
                        {formatCurrency(Number(d.valor))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Section */}
              <div className="relative w-full">
                <div className="flex items-center justify-between bg-white border-2 border-emerald-600 rounded-xl p-3 w-full">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">Total Recebido</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-bold text-emerald-600/60 uppercase">R$</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(totalValue).replace("R$", "").trim()}
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1 py-2 w-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Smartphone className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Pagamento</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">
                    {PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Efetivado</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">
                    {paymentDate ? formatDate(paymentDate) : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Hash className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Protocolo</span>
                  </div>
                  <p className="text-[9px] font-mono font-bold text-slate-500">
                    {firstLancamento?.sessao_id?.slice(0, 12).toUpperCase() ?? "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-end">
                   {/* QR Code with textual receipt data */}
                   <div className="h-14 w-14 border border-slate-200 rounded p-0.5 bg-white shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          `SIGESS - RECIBO DE ATENDIMENTO\n` +
                          `SOCIO: ${memberName ?? "—"}\n` +
                          `CPF: ${memberCpf ?? "—"}\n` +
                          `TOTAL: ${formatCurrency(totalValue)}\n` +
                          `DATA: ${paymentDate ? formatDate(paymentDate) : "—"}\n` +
                          `PROT: ${firstLancamento?.sessao_id?.slice(0, 12).toUpperCase() ?? "—"}`
                        )}`}
                        alt="QR Code de Validação"
                        className="h-full w-full object-contain"
                      />
                   </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center space-y-1 w-full">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                  Documento gerado eletronicamente via SIGESS
                </p>
                <p className="text-[7px] text-slate-300 font-medium italic">
                  Este recibo comprova a quitação dos débitos acima listados.
                </p>
              </div>
            </div>
          </PrintLayout>
        </div>
      </DialogContent>
    </Dialog>
  );
}
