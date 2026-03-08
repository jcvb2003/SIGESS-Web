import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { MoneyField } from "../shared/MoneyField";
import { cn } from "@/shared/lib/utils";
import { FileText, X, AlertTriangle, Calendar } from "lucide-react";
import type { FinanceDAE, EditDAEData } from "../../types/finance.types";
import { useParametersData } from "@/modules/settings/hooks/useParametersData";
import { isMonthInDefeso } from "../../utils/defesoUtils";

const editDAESchema = z.object({
  valor: z.number().min(0.01, "O valor deve ser maior que zero"),
  competencia_mes: z.number().min(1).max(12),
  competencia_ano: z.number().min(2000).max(2100),
});

type EditDAEForm = z.infer<typeof editDAESchema>;

interface EditDAEDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly dae: FinanceDAE | null;
  readonly onConfirm: (data: EditDAEData) => void;
  readonly isPending: boolean;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function EditDAEDialog({
  open,
  onOpenChange,
  dae,
  onConfirm,
  isPending,
}: EditDAEDialogProps) {
  const { parameters } = useParametersData();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditDAEForm>({
    resolver: zodResolver(editDAESchema),
    defaultValues: {
      valor: 0,
      competencia_mes: 1,
      competencia_ano: new Date().getFullYear(),
    },
  });

  const selectedYear = useWatch({
    control,
    name: "competencia_ano",
  });

  useEffect(() => {
    if (dae && open) {
      reset({
        valor: dae.valor ?? 0,
        competencia_mes: dae.competencia_mes ?? 1,
        competencia_ano: dae.competencia_ano ?? new Date().getFullYear(),
      });
    }
  }, [dae, open, reset]);

  const onSubmit = (data: EditDAEForm) => {
    onConfirm({
      valor: data.valor,
      competencia_mes: data.competencia_mes,
      competencia_ano: data.competencia_ano,
      year: data.competencia_ano
    });
  };

  const buttonLabel = "Salvar Repasse";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 outline-none [&>button]:hidden overflow-hidden transition-all duration-300 max-w-md">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <FileText className="h-5 w-5" />
              <DialogTitle className="text-xl font-bold tracking-tight">
                Editar Repasse DAE
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Ano de Competência - Somente Leitura */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                  Ano de Competência
                </Label>
                <p className="text-[10px] text-slate-400 mt-1">Competência original (Não editável)</p>
              </div>
            </div>
            <Controller
              control={control}
              name="competencia_ano"
              render={({ field }) => (
                <Input 
                  type="number" 
                  readOnly
                  className="h-10 w-24 text-center text-sm font-bold bg-slate-100 border-slate-200 shadow-none cursor-not-allowed opacity-70" 
                  {...field} 
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-600 px-0.5">Mês de Competência</Label>
              <Controller
                control={control}
                name="competencia_mes"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="h-10 text-sm border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => {
                        const isDefeso = isMonthInDefeso(m.value, selectedYear, parameters);
                        return (
                          <SelectItem 
                            key={m.value} 
                            value={String(m.value)} 
                            className={cn("text-sm", isDefeso && "text-amber-600 bg-amber-50")}
                            disabled={isDefeso}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              {m.label}
                              {isDefeso && <AlertTriangle className="h-3 w-3" />}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Controller
              control={control}
              name="valor"
              render={({ field }) => (
                <MoneyField
                  label="Valor do Repasse"
                  value={field.value ?? 0}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.valor && <p className="text-[10px] text-red-500 font-medium px-1 mt-1">{errors.valor.message}</p>}
          </div>

          <div className="pt-4 flex items-center gap-3 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-11 text-xs font-bold text-slate-500 hover:bg-slate-50"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Calendar className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : buttonLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
