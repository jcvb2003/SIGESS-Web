import { Control, Controller } from "react-hook-form";
import { useMemo } from "react";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { MoneyField } from "../../shared/MoneyField";
import type { FinanceSettingsForm } from "../../../schemas/financeSettings.schema";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface GeneralSettingsTabProps {
  readonly control: Control<FinanceSettingsForm>;
  readonly isPending: boolean;
  readonly isDirty: boolean;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

export function GeneralSettingsTab({
  control,
  isPending,
  isDirty,
  onSubmit,
  onCancel,
}: Readonly<GeneralSettingsTabProps>) {
  // Constantes de data/alerta migradas para dentro do componente
  const EXPIRATION_DAYS = useMemo(() => Array.from({ length: 28 }, (_, i) => i + 1), []);
  const ALERT_YEARS = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  const YEAR_OPTIONS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2023;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  }, []);

  return (
    <ScrollArea className="h-full px-4 sm:px-6">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Regime padrão <span className="text-red-500">*</span></Label>
            <Controller
              control={control}
              name="regimePadrao"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anuidade">Anuidade</SelectItem>
                    <SelectItem value="mensalidade">Mensalidade</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Dia vencimento <span className="text-red-500">*</span></Label>
            <Controller
              control={control}
              name="diaVencimento"
              render={({ field }) => (
                <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Dia" /></SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_DAYS.map((d) => (
                      <SelectItem key={d} value={d.toString()}>Dia {String(d).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Ano base cobrança <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="anoBaseCobranca"
            render={({ field }) => (
              <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="pt-2">
          <h3 className="text-sm font-semibold mb-3 border-b pb-1">Valores e Taxas</h3>
          <div className="grid grid-cols-2 gap-4">
            <Controller control={control} name="valorAnuidade" render={({ field }) => <MoneyField label="Anuidade" value={field.value ?? 0} onChange={field.onChange} />} />
            <Controller control={control} name="valorMensalidade" render={({ field }) => <MoneyField label="Mensalidade" value={field.value ?? 0} onChange={field.onChange} />} />
            <Controller control={control} name="valorInscricao" render={({ field }) => <MoneyField label="Inscrição" value={field.value ?? 0} onChange={field.onChange} />} />
            <Controller control={control} name="valorTransferencia" render={({ field }) => <MoneyField label="Transferência" value={field.value ?? 0} onChange={field.onChange} />} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold">Bloquear inadimplentes</Label>
            <p className="text-xs text-muted-foreground">Impede assinaturas de sócios com débitos</p>
          </div>
          <Controller
            control={control}
            name="bloquearInadimplente"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Alerta de Inadimplência <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="anosAtrasoAlerta"
            render={({ field }) => (
              <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALERT_YEARS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y} {y === 1 ? "ano" : "anos"} de atraso</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            size="sm"
            className="bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isPending || !isDirty}
            className="gap-1.5"
          >
            {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</> : <><Check className="h-3.5 w-3.5" /> Salvar</>}
          </Button>
        </div>
      </form>
    </ScrollArea>
  );
}
