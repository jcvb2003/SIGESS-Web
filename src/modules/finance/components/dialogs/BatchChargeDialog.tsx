import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Loader2, CheckCircle2, XCircle, SkipForward, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/shared/lib/supabase/client";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

interface BatchChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BatchResult {
  total: number;
  succeeded: { cpf: string; lancamentoId: string; fcxId: string; paymentUrl?: string }[];
  failed: { cpf: string; error: string }[];
  skipped: { cpf: string; reason: string }[];
}

const MESES = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(String);

export function BatchChargeDialog({ open, onOpenChange }: Readonly<BatchChargeDialogProps>) {
  const { tenantId, unitId } = useActiveScope();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);

  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [ano, setAno] = useState(String(CURRENT_YEAR));
  const [billingType, setBillingType] = useState<"BOLETO" | "PIX">("BOLETO");
  const [dueDate, setDueDate] = useState("");

  const handleClose = () => {
    setResult(null);
    setDueDate("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!tenantId) return;
    if (!dueDate) { toast.error("Informe a data de vencimento."); return; }

    setIsSubmitting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("member-collection-batch", {
        body: {
          action: "batch-charge",
          p_tenant_id: tenantId,
          p_unit_id: unitId ?? null,
          competencia_ano: Number(ano),
          competencia_mes: Number(mes),
          billing_type: billingType,
          due_date: dueDate,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as BatchResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar cobranças");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Gerar cobranças do mês
          </DialogTitle>
          <DialogDescription>
            Cria cobranças Asaas para todos os sócios elegíveis da competência.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mês</Label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ano</Label>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de cobrança</Label>
              <Select value={billingType} onValueChange={(v) => setBillingType(v as "BOLETO" | "PIX")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Data de vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            {unitId && (
              <p className="text-xs text-muted-foreground">
                Polo ativo: cobranças geradas apenas para sócios deste polo.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Gerar cobranças
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-success/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-2xl font-bold text-success">{result.succeeded.length}</p>
                <p className="text-xs text-muted-foreground">geradas</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-2xl font-bold text-destructive">{result.failed.length}</p>
                <p className="text-xs text-muted-foreground">falhas</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <SkipForward className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold">{result.skipped.length}</p>
                <p className="text-xs text-muted-foreground">ignorados</p>
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-destructive">Falhas:</p>
                {result.failed.map((f) => (
                  <p key={f.cpf} className="text-xs text-muted-foreground">{f.cpf}: {f.error}</p>
                ))}
              </div>
            )}

            <Button className="w-full" onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
