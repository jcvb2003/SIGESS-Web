import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { usePaymentSession } from "../../hooks/edit/usePaymentSession";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { 
  Loader2, 
  Check, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Trash2
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { 
  BoletoType, 
  PaymentMethod, 
  DAEItem
} from "../../types/finance.types";

interface DAEDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly socioCpf: string | null;
  readonly socioName?: string;
}

const BOLETO_TYPES: { value: BoletoType; label: string; description: string }[] = [
  { value: "unitario", label: "Unitário (1 competência)", description: "Uma única competência" },
  { value: "agrupado", label: "Agrupado (2+ competências)", description: "Múltiplas competências selecionadas" },
  { value: "anual", label: "Anual (12 competências)", description: "Todas as 12 competências do ano" },
];

const FORMAS_PAGAMENTO: { value: PaymentMethod; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro (espécie)" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência bancária" },
  { value: "boleto", label: "Boleto bancário" },
  { value: "cartao", label: "Cartão débito/crédito" },
];

/**
 * Utilitário para formatar número enquanto digita (Nubank Style).
 * Exemplo: 1 -> 0,01 | 12 -> 0,12 | 125 -> 1,25
 */
const formatMoneyNubank = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function DAEDialog({
  open,
  onOpenChange,
  socioCpf,
  socioName,
}: DAEDialogProps) {
  const paymentMutation = usePaymentSession();

  const [tipoBoleto, setTipoBoleto] = useState<BoletoType>("unitario");
  const [valorPorCompetencia, setValorPorCompetencia] = useState(0);
  const [displayValue, setDisplayValue] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ ano: number; mes: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("boleto");
  const [boletoPago, setBoletoPago] = useState(true);
  const [dataPagamentoBoleto, setDataPagamentoBoleto] = useState(
    new Date().toLocaleDateString("sv"),
  );
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toLocaleDateString("sv"),
  );

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Itens efetivos baseados no tipo
  const items = useMemo(() => {
    if (tipoBoleto === "unitario") {
      return [{ ano: currentYear, mes: currentMonth }];
    }
    if (tipoBoleto === "anual") {
      return Array.from({ length: 12 }, (_, i) => ({
        ano: currentYear,
        mes: i + 1,
      }));
    }
    return selectedItems.length > 0 
      ? selectedItems 
      : [{ ano: currentYear, mes: currentMonth }, { ano: currentYear, mes: currentMonth === 12 ? 1 : currentMonth + 1 }];
  }, [tipoBoleto, selectedItems, currentYear, currentMonth]);

  const addCompetencia = () => {
    const last = items.at(-1);
    if (!last) return;
    
    let nextMonth = last.mes + 1;
    let nextYear = last.ano;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    setSelectedItems([...items, { ano: nextYear, mes: nextMonth }]);
  };

  const removeCompetencia = (index: number) => {
    if (items.length > 1) {
      setSelectedItems(items.filter((_, i) => i !== index));
    }
  };

  const updateCompetencia = (index: number, field: "ano" | "mes", value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replaceAll(/\D/g, "");
    const numericValue = Number(digits) / 100;
    setValorPorCompetencia(numericValue);
    setDisplayValue(formatMoneyNubank(numericValue));
  };

  const totalValue = (items.length || 0) * (valorPorCompetencia || 0);
  const canConfirm = totalValue > 0 && items.length > 0;

  const handleSubmit = async () => {
    if (!socioCpf) return;

    const sessaoId = crypto.randomUUID();
    const daeItems: DAEItem[] = items.map(item => ({
      tipo_boleto: tipoBoleto,
      competencia_ano: item.ano,
      competencia_mes: item.mes,
      valor: valorPorCompetencia,
    }));

    await paymentMutation.mutateAsync({
      sessaoId,
      socioCpf,
      items: [], // Sessão exclusiva de DAE
      daes: daeItems,
      paymentMethod,
      paymentDate: dataRecebimento,
    });

    onOpenChange(false);
  };

  const initials = useMemo(() => {
    return socioName
      ?.split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [socioName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl p-0 outline-none overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <FileText className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold tracking-tight">Registrar Repasse DAE</DialogTitle>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Documento de Arrecadação Estadual — Repasse puro
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 h-full max-h-[85vh]">
          <div className="space-y-5 py-6">
            {/* Sócio Header */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 border border-slate-100 p-3 shadow-sm">
               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-200">
                {initials ?? "?"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{socioName}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">CPF: {socioCpf}</p>
              </div>
            </div>

            {/* DAE Info Alert */}
            <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                <strong className="block mb-0.5">Nota de Repasse:</strong> O DAE é arrecadado pela entidade e repassado integralmente ao estado. Este valor não compõe o faturamento da associação.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TIPO DE BOLETO</Label>
                <Select value={tipoBoleto} onValueChange={(v) => {
                  setTipoBoleto(v as BoletoType);
                  setSelectedItems([]); // Reset ao mudar tipo
                }}>
                  <SelectTrigger className="h-10 text-xs font-semibold border-slate-200 focus:ring-emerald-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOLETO_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs font-medium">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VALOR/COMPETÊNCIA</Label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                    R$
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleMoneyChange}
                    onFocus={(e) => e.target.select()}
                    className="h-10 pl-9 text-sm border-slate-200 focus:ring-emerald-500 font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Competencias List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detalhamento de Competências</Label>
                {tipoBoleto === "agrupado" && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={addCompetencia}
                    className="h-7 text-[10px] font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 px-3 rounded-full border border-emerald-100 bg-white shadow-sm"
                  >
                    <Plus className="h-3 w-3" />
                    ADICIONAR MÊS
                  </Button>
                )}
              </div>
              
              <div className={cn(
                "rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden",
                items.length > 4 && "max-h-48 overflow-y-auto"
              )}>
                {items.map((item, index) => (
                  <div 
                    key={`${index}-${item.ano}-${item.mes}`} 
                    className={cn(
                      "flex items-center gap-3 p-3 transition-colors",
                      index !== items.length - 1 && "border-b border-slate-100",
                      index % 2 === 1 && "bg-slate-50/30"
                    )}
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Select 
                        value={item.ano.toString()} 
                        onValueChange={(v) => updateCompetencia(index, 'ano', Number.parseInt(v))}
                        disabled={tipoBoleto === "anual" || tipoBoleto === "unitario"}
                      >
                        <SelectTrigger className="h-8 text-xs font-bold border-transparent shadow-none hover:bg-slate-100 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[currentYear - 1, currentYear, currentYear + 1].map((ano) => (
                            <SelectItem key={ano} value={ano.toString()} className="text-xs font-semibold">
                              {ano}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={item.mes.toString()} 
                        onValueChange={(v) => updateCompetencia(index, 'mes', Number.parseInt(v))}
                        disabled={tipoBoleto === "anual" || tipoBoleto === "unitario"}
                      >
                        <SelectTrigger className="h-8 text-xs font-bold border-transparent shadow-none hover:bg-slate-100 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                            <SelectItem key={mes} value={mes.toString()} className="text-xs font-semibold">
                              {mes.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-xs font-bold text-slate-700 w-20 text-right">
                      {formatCurrency(valorPorCompetencia)}
                    </div>
                    
                    {tipoBoleto === "agrupado" && items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-300 hover:text-red-500 transition-colors"
                        onClick={() => removeCompetencia(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method & Receipt Info */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Recebido via</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger className="h-9 text-xs font-semibold border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-xs font-medium">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Data Recebimento</Label>
                  <Input
                    type="date"
                    value={dataRecebimento}
                    onChange={(e) => setDataRecebimento(e.target.value)}
                    className="h-9 text-xs font-bold border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60 mt-2">
                <Checkbox
                  id="boletoPago"
                  checked={boletoPago}
                  onCheckedChange={(checked: boolean | "indeterminate") => setBoletoPago(!!checked)}
                  className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor="boletoPago" className="text-xs font-semibold text-slate-600 cursor-pointer">
                  O boleto DAE físico já foi pago no banco?
                </Label>
              </div>

              {boletoPago && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Data do Pagamento no Banco</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      type="date"
                      value={dataPagamentoBoleto}
                      onChange={(e) => setDataPagamentoBoleto(e.target.value)}
                      className="h-9 pl-9 text-xs font-bold border-slate-200 bg-white focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Area (Inline Content) */}
            <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold">TOTAL REPASSE</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold h-10 px-4"
                  >
                    CANCELAR
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={paymentMutation.isPending || !canConfirm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-10 px-6 shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
                  >
                    {paymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    CONFIRMAR REPASSE
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
