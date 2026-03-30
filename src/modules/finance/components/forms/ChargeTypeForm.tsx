import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Loader2, Check, X } from "lucide-react";
import { MoneyField } from "../shared/MoneyField";
import {
  chargeTypeSchema,
  type ChargeTypeFormValues,
} from "../../schemas/chargeType.schema";
import type { ChargeType } from "../../types/finance.types";

interface ChargeTypeFormProps {
  readonly initial?: ChargeType | null;
  readonly isPending: boolean;
  readonly onSubmit: (data: ChargeTypeFormValues) => Promise<void>;
  readonly onCancel: () => void;
}

export function ChargeTypeForm({
  initial,
  isPending,
  onSubmit,
  onCancel,
}: ChargeTypeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChargeTypeFormValues>({
    resolver: zodResolver(chargeTypeSchema),
    defaultValues: {
      categoria: "contribuicao",
      nome: "",
      descricao: "",
      valorPadrao: null,
      obrigatoriedade: null,
      ativo: true,
    },
  });

  useEffect(() => {
    if (!initial) return;
    reset({
      categoria: initial.categoria as "contribuicao" | "cadastro_governamental",
      nome: initial.nome,
      descricao: initial.descricao ?? "",
      valorPadrao: initial.valor_padrao ?? null,
      obrigatoriedade: (initial.obrigatoriedade as "compulsoria" | "facultativa" | null) ?? null,
      ativo: initial.ativo ?? true,
    });
  }, [initial, reset]);

  const categoria = watch("categoria");

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Categoria <span className="text-red-500">*</span>
          </Label>
          <Controller
            control={control}
            name="categoria"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribuicao">Contribuição</SelectItem>
                  <SelectItem value="cadastro_governamental">
                    Cadastro Governamental
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoria && (
            <p className="text-xs text-red-500">{errors.categoria.message}</p>
          )}
        </div>

        {categoria === "contribuicao" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Obrigatoriedade <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="obrigatoriedade"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) =>
                    field.onChange(v as "compulsoria" | "facultativa")
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compulsoria">Compulsória</SelectItem>
                    <SelectItem value="facultativa">Facultativa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.obrigatoriedade && (
              <p className="text-xs text-red-500">
                {errors.obrigatoriedade.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          Nome <span className="text-red-500">*</span>
        </Label>
        <Input
          {...register("nome")}
          className="h-9 text-xs"
          placeholder="Ex.: REAP 2025, Reforma da Sede..."
        />
        {errors.nome && (
          <p className="text-xs text-red-500">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Descrição</Label>
        <Textarea
          {...register("descricao")}
          className="text-xs resize-none"
          rows={2}
          placeholder="Descrição opcional..."
        />
      </div>

      <Controller
        control={control}
        name="valorPadrao"
        render={({ field }) => (
          <MoneyField
            label="Valor padrão"
            value={field.value ?? 0}
            onChange={field.onChange}
          />
        )}
      />

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label className="text-xs font-semibold">Ativo</Label>
          <p className="text-xs text-muted-foreground">
            Desativar oculta das listas de seleção
          </p>
        </div>
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-emerald-600"
            />
          )}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8 text-xs gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {initial ? "Salvar alterações" : "Criar tipo"}
        </Button>
      </div>
    </form>
  );
}
