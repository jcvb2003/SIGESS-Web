import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
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
import { useMemberConfig } from "../../hooks/data/useMemberConfig";
import { useUpdateMemberConfig } from "../../hooks/edit/useUpdateMemberConfig";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface MemberFinanceConfigFormProps {
  readonly cpf: string;
  readonly mode: "isencao" | "liberacao" | "regime";
  readonly onClose: () => void;
}

interface ConfigFormValues {
  isento: boolean;
  liberadoPresidente: boolean;
  regime: "anuidade" | "mensalidade";
  observacao: string;
}

export function MemberFinanceConfigForm({
  cpf,
  mode,
  onClose,
}: MemberFinanceConfigFormProps) {
  const { config, isLoading } = useMemberConfig(cpf);
  const { updateConfig, updateRegime } = useUpdateMemberConfig();

  const { control, handleSubmit, reset, formState: { isDirty } } =
    useForm<ConfigFormValues>({
      defaultValues: {
        isento: false,
        liberadoPresidente: false,
        regime: "anuidade",
        observacao: "",
      },
    });

  useEffect(() => {
    if (isLoading) return;
    reset({
      isento: config?.isento ?? false,
      liberadoPresidente: config?.liberado_pelo_presidente ?? false,
      regime: (config?.regime as "anuidade" | "mensalidade") ?? "anuidade",
      observacao: "",
    });
  }, [config, isLoading, reset]);

  const regime = useWatch({ control, name: "regime" });
  const regimeAtual = (config?.regime as "anuidade" | "mensalidade") ?? "anuidade";
  const regimeChanged = regime !== regimeAtual;

  const isPending = updateConfig.isPending || updateRegime.isPending;

  const onSubmit = handleSubmit(async (data) => {
    if (mode === "isencao") {
      await updateConfig.mutateAsync({
        cpf,
        updates: { isento: data.isento },
      });
    } else if (mode === "liberacao") {
      await updateConfig.mutateAsync({
        cpf,
        updates: { liberado_pelo_presidente: data.liberadoPresidente },
      });
    } else if (mode === "regime") {
      if (regimeChanged) {
        await updateRegime.mutateAsync({
          cpf,
          regime: data.regime,
          observation: data.observacao || undefined,
        });
      }
    }
    onClose();
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 mt-3">
      {mode === "isencao" && (
        <>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Isenção de Contribuições
          </p>
          <div className="flex items-center justify-between rounded-lg border bg-white p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Sócio isento</Label>
              <p className="text-xs text-muted-foreground">
                Isento não gera inadimplência por anuidade/mensalidade
              </p>
            </div>
            <Controller
              control={control}
              name="isento"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-blue-600"
                />
              )}
            />
          </div>
        </>
      )}

      {mode === "liberacao" && (
        <>
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Liberação Presidencial
          </p>
          <div className="flex items-center justify-between rounded-lg border bg-white p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Liberado pelo presidente</Label>
              <p className="text-xs text-muted-foreground">
                Sócio inadimplente autorizado a assinar documentos
              </p>
            </div>
            <Controller
              control={control}
              name="liberadoPresidente"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-amber-500"
                />
              )}
            />
          </div>
        </>
      )}

      {mode === "regime" && (
        <>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
            Regime de Contribuição
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Regime</Label>
            <Controller
              control={control}
              name="regime"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anuidade">Anuidade (pagamento anual)</SelectItem>
                    <SelectItem value="mensalidade">Mensalidade (pagamento mensal)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {regimeChanged && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observação (auditoria)</Label>
              <Controller
                control={control}
                name="observacao"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="text-xs resize-none bg-white"
                    rows={2}
                    placeholder="Motivo da mudança de regime..."
                  />
                )}
              />
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 text-xs gap-1.5 text-slate-500"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Salvar
        </Button>
      </div>
    </form>
  );
}
