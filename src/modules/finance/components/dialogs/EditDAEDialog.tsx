import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { MoneyField } from "../shared/MoneyField";
import { Loader2, FileText, X } from "lucide-react";
import type { FinanceDAE } from "../../types/finance.types";

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
  readonly onConfirm: (data: Partial<FinanceDAE>) => void;
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

/**
 * Diálogo para edição de repasses de DAE.
 */
export function EditDAEDialog({
  open,
  onOpenChange,
  dae,
  onConfirm,
  isPending,
}: EditDAEDialogProps) {
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

  useEffect(() => {
    if (dae && open) {
      reset({
        valor: dae.valor,
        competencia_mes: dae.competencia_mes,
        competencia_ano: dae.competencia_ano,
      });
    }
  }, [dae, open, reset]);

  const onSubmit = (data: EditDAEForm) => {
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 outline-none [&>button]:hidden overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <FileText className="h-5 w-5" />
              <DialogTitle className="text-xl">Editar Repasse DAE</DialogTitle>
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Controller
            control={control}
            name="valor"
            render={({ field }) => (
              <MoneyField
                label="Valor do Repasse"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.valor && <p className="text-xs text-red-500">{errors.valor.message}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mês de Competência</Label>
              <Controller
                control={control}
                name="competencia_mes"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ano de Competência</Label>
              <Controller
                control={control}
                name="competencia_ano"
                render={({ field }) => (
                  <Input 
                    type="number" 
                    className="h-9 text-xs" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
