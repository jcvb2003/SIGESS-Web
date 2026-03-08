import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { requiredDateSchema } from "@/shared/utils/validators/dateValidators";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { MoneyField } from "../shared/MoneyField";
import { PaymentMethodSelect } from "../shared/PaymentMethodSelect";
import { Loader2, Pencil, X } from "lucide-react";
import type { FinanceLancamento, PaymentMethod } from "../../types/finance.types";

const editLancamentoSchema = z.object({
  valor: z.number().min(0.01, "O valor deve ser maior que zero"),
  data_pagamento: requiredDateSchema("A data do pagamento é inválida"),

  forma_pagamento: z.string().min(1, "A forma de pagamento é obrigatória"),
  descricao: z.string().optional(),
});

type EditLancamentoForm = z.infer<typeof editLancamentoSchema>;

interface EditLancamentoDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly lancamento: FinanceLancamento | null;
  readonly onConfirm: (data: Partial<FinanceLancamento>) => void;
  readonly isPending: boolean;
}

/**
 * Diálogo para edição de lançamentos financeiros (Anuidades, Taxas, etc).
 */
export function EditLancamentoDialog({
  open,
  onOpenChange,
  lancamento,
  onConfirm,
  isPending,
}: EditLancamentoDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditLancamentoForm>({
    resolver: zodResolver(editLancamentoSchema),
    defaultValues: {
      valor: 0,
      data_pagamento: "",
      forma_pagamento: "dinheiro",
      descricao: "",
    },
  });

  useEffect(() => {
    if (lancamento && open) {
      reset({
        valor: lancamento.valor ?? 0,
        data_pagamento: lancamento.data_pagamento ?? "",
        forma_pagamento: (lancamento.forma_pagamento as PaymentMethod) ?? "dinheiro",
        descricao: lancamento.descricao ?? "",
      });
    }
  }, [lancamento, open, reset]);

  const onSubmit = (data: EditLancamentoForm) => {
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 outline-none [&>button]:hidden overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Pencil className="h-5 w-5" />
              <DialogTitle className="text-xl">Editar Lançamento</DialogTitle>
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
                label="Valor do Lançamento"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.valor && <p className="text-xs text-red-500">{errors.valor.message}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Data do Pagamento</Label>
              <Controller
                control={control}
                name="data_pagamento"
                render={({ field }) => (
                  <Input type="date" className="h-9 text-xs" {...field} />
                )}
              />
            </div>

            <Controller
              control={control}
              name="forma_pagamento"
              render={({ field }) => (
                <PaymentMethodSelect
                  value={field.value as PaymentMethod}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Observação / Descrição</Label>
            <Controller
              control={control}
              name="descricao"
              render={({ field }) => (
                <Input className="h-9 text-xs" placeholder="Ex: Ajuste de valor" {...field} />
              )}
            />
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
