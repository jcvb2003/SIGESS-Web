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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { PaymentMethodSelect } from "../shared/PaymentMethodSelect";
import { FileText, X, Calendar, CheckCircle2 } from "lucide-react";
import type { FinanceDAE, EditDAEData, PaymentMethod } from "../../types/finance.types";
import { isNotFutureDate } from "@/shared/utils/validators/dateValidators";
import { getTodayISO } from "@/shared/utils/date";
import { toast } from "sonner";

const editDAESchema = z.object({
  forma_pagamento: z.enum(["dinheiro", "pix", "transferencia", "boleto", "cartao"]),
  boleto_pago: z.boolean(),
  data_pagamento_boleto: z.string().nullable().optional(),
});

type EditDAEForm = z.infer<typeof editDAESchema>;

interface EditDAEDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly dae: FinanceDAE | null;
  readonly onConfirm: (data: EditDAEData) => void;
  readonly isPending: boolean;
}

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
    setValue,
    watch,
  } = useForm<EditDAEForm>({
    resolver: zodResolver(editDAESchema),
    defaultValues: {
      forma_pagamento: "boleto",
      boleto_pago: false,
      data_pagamento_boleto: null,
    },
  });

  const boletoPago = watch("boleto_pago");
  const competenciaLabel =
    dae?.competencia_mes && dae?.competencia_ano
      ? `${String(dae.competencia_mes).padStart(2, "0")}/${dae.competencia_ano}`
      : "Competência indisponível";

  useEffect(() => {
    if (!dae || !open) return;

    reset({
      forma_pagamento: (dae.forma_pagamento as PaymentMethod | null) ?? "boleto",
      boleto_pago: Boolean(dae.boleto_pago),
      data_pagamento_boleto: dae.data_pagamento_boleto ?? null,
    });
  }, [dae, open, reset]);

  const onSubmit = (data: EditDAEForm) => {
    const paymentDate = data.boleto_pago
      ? data.data_pagamento_boleto || getTodayISO()
      : null;

    if (data.boleto_pago && (!paymentDate || !isNotFutureDate(paymentDate))) {
      toast.error("A data de pagamento do boleto não pode ser futura.");
      return;
    }

    onConfirm({
      forma_pagamento: data.forma_pagamento,
      boleto_pago: data.boleto_pago,
      data_pagamento_boleto: paymentDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 outline-none [&>button]:hidden overflow-hidden transition-all duration-300 max-w-md">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileText className="h-5 w-5" />
              <DialogTitle className="text-xl font-bold tracking-tight">
                Editar Repasse DAE
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 border-border transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="bg-muted p-4 rounded-xl border border-border/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                  Competência
                </Label>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {competenciaLabel}
                </p>
              </div>
            </div>
          </div>

          <Controller
            control={control}
            name="forma_pagamento"
            render={({ field }) => (
              <PaymentMethodSelect
                value={field.value}
                onChange={field.onChange}
                label="Forma de Pagamento"
              />
            )}
          />

          <div className="bg-muted/50 p-4 rounded-xl border border-dashed border-border space-y-4">
            <div className="flex items-center space-x-2">
              <Controller
                control={control}
                name="boleto_pago"
                render={({ field }) => (
                  <Checkbox
                    id="edit-boleto-pago"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      const isChecked = Boolean(checked);
                      field.onChange(isChecked);
                      if (isChecked && !watch("data_pagamento_boleto")) {
                        setValue("data_pagamento_boleto", getTodayISO());
                      }
                      if (!isChecked) {
                        setValue("data_pagamento_boleto", null);
                      }
                    }}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                )}
              />
              <Label
                htmlFor="edit-boleto-pago"
                className="text-xs font-semibold text-muted-foreground cursor-pointer"
              >
                Marcar boleto DAE como pago
              </Label>
            </div>

            {boletoPago && (
              <Controller
                control={control}
                name="data_pagamento_boleto"
                render={({ field }) => (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                      Pagamento no Banco
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value || null)}
                        className="h-9 pl-9 text-xs font-bold border-border bg-card shadow-sm rounded-md"
                      />
                    </div>
                  </div>
                )}
              />
            )}
          </div>

          <div className="pt-4 flex items-center gap-3 border-t border-border/50 mt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-11 text-xs font-bold text-muted-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-11 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Calendar className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
