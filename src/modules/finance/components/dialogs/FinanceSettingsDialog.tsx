import { useEffect, useMemo, useState } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Loader2, Check, X, Plus, Pencil, ToggleLeft } from "lucide-react";
import { MoneyField } from "../shared/MoneyField";
import { useFinanceSettings } from "../../hooks/data/useFinanceSettings";
import { useChargeTypes } from "../../hooks/data/useChargeTypes";
import { useUpdateFinanceSettings, useChargeTypeMutations } from "../../hooks/edit/useUpdateMemberConfig";
import {
  financeSettingsSchema,
  type FinanceSettingsForm,
} from "../../schemas/financeSettings.schema";
import { ChargeTypeForm } from "../forms/ChargeTypeForm";
import type { ChargeType } from "../../types/finance.types";
import type { ChargeTypeFormValues } from "../../schemas/chargeType.schema";
import { cn } from "@/shared/lib/utils";
interface FinanceSettingsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function FinanceSettingsDialog({
  open,
  onOpenChange,
}: FinanceSettingsDialogProps) {
  const { settings, isLoading: loadingSettings } = useFinanceSettings();
  const { chargeTypes, isLoading: loadingChargeTypes } = useChargeTypes();
  const updateMutation = useUpdateFinanceSettings();
  const { createChargeType, updateChargeType, toggleActive } = useChargeTypeMutations();

  const [editingCharge, setEditingCharge] = useState<ChargeType | "new" | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FinanceSettingsForm>({
    resolver: zodResolver(financeSettingsSchema),
    defaultValues: {
      regimePadrao: "anuidade",
      diaVencimento: 10,
      anoBaseCobranca: 2024,
      valorAnuidade: 0,
      valorMensalidade: 0,
      valorInscricao: 0,
      valorTransferencia: 0,
      bloquearInadimplente: false,
      anosAtrasoAlerta: 2,
    },
  });

  // Constantes extraídas
  const EXPIRATION_DAYS = useMemo(() => Array.from({ length: 28 }, (_, i) => i + 1), []);
  const ALERT_YEARS = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);
  const YEAR_OPTIONS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2023;
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  }, []);

  // Sincronizar dados
  useEffect(() => {
    if (!settings) return;
    reset({
      regimePadrao: (settings.regime_padrao as "anuidade" | "mensalidade") ?? "anuidade",
      diaVencimento: settings.dia_vencimento ?? 10,
      anoBaseCobranca: settings.ano_base_cobranca ?? 2024,
      valorAnuidade: settings.valor_anuidade ?? 0,
      valorMensalidade: settings.valor_mensalidade ?? 0,
      valorInscricao: settings.valor_inscricao ?? 0,
      valorTransferencia: settings.valor_transferencia ?? 0,
      bloquearInadimplente: settings.bloquear_inadimplente ?? false,
      anosAtrasoAlerta: settings.anos_atraso_alerta ?? 2,
    });
  }, [settings, reset]);

  const handleClose = () => {
    setEditingCharge(null);
    onOpenChange(false);
  };

  const handleChargeSubmit = async (data: ChargeTypeFormValues) => {
    const payload = {
      categoria: data.categoria,
      nome: data.nome,
      descricao: data.descricao ?? null,
      valor_padrao: data.valorPadrao ?? null,
      obrigatoriedade: data.obrigatoriedade ?? null,
      ativo: data.ativo,
    };
    if (editingCharge && editingCharge !== "new") {
      await updateChargeType.mutateAsync({ id: editingCharge.id, updates: payload });
    } else {
      await createChargeType.mutateAsync(payload as Parameters<typeof createChargeType.mutateAsync>[0]);
    }
    setEditingCharge(null);
  };

  const onSubmit = async (data: FinanceSettingsForm) => {
    if (!settings?.id) return;
    await updateMutation.mutateAsync({
      id: settings.id,
      updates: {
        regime_padrao: data.regimePadrao,
        dia_vencimento: data.diaVencimento,
        ano_base_cobranca: data.anoBaseCobranca,
        valor_anuidade: data.valorAnuidade,
        valor_mensalidade: data.valorMensalidade,
        valor_inscricao: data.valorInscricao,
        valor_transferencia: data.valorTransferencia,
        bloquear_inadimplente: data.bloquearInadimplente,
        anos_atraso_alerta: data.anosAtrasoAlerta,
      },
    });
    handleClose();
  };


  if (loadingSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </DialogContent>
      </Dialog>
    );
  }

  const chargeFormPending = createChargeType.isPending || updateChargeType.isPending;

  const chargesContent = (() => {
    if (loadingChargeTypes) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando...
        </div>
      );
    }

    if (chargeTypes.length === 0) {
      return (
        <p className="text-xs text-center text-muted-foreground py-8">
          Nenhum tipo de cobrança cadastrado.
        </p>
      );
    }

    return (
      <div className="divide-y rounded-lg border overflow-hidden">
        {chargeTypes.map((ct) => (
          <div
            key={ct.id}
            className={cn(
              "flex items-center justify-between p-3 bg-white",
              !ct.ativo && "opacity-50",
            )}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {ct.nome}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {ct.categoria === "contribuicao" ? "Contribuição" : "Cadastro Gov."}
                {ct.obrigatoriedade && ` · ${ct.obrigatoriedade}`}
                {ct.valor_padrao != null && ` · R$ ${Number(ct.valor_padrao).toFixed(2)}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                title={ct.ativo ? "Desativar" : "Ativar"}
                onClick={() => toggleActive.mutate({ id: ct.id, ativo: !ct.ativo })}
                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
              >
                <ToggleLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Editar"
                onClick={() => setEditingCharge(ct)}
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 outline-none [&>button]:hidden overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Configurações Financeiras
                </DialogTitle>
                <p className="mt-0.5 text-xs text-slate-500 font-medium tracking-tight">
                  Parâmetros globais do sistema
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="parametros" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-6 mt-3 mb-0 h-9 shrink-0 w-auto justify-start bg-muted/50">
              <TabsTrigger value="parametros" className="text-xs">Parâmetros</TabsTrigger>
              <TabsTrigger value="tipos" className="text-xs">Tipos de Cobrança</TabsTrigger>
            </TabsList>

            {/* ── Tab: Parâmetros ── */}
            <TabsContent value="parametros" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full px-4 sm:px-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
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
                      render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />}
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

                  <div className="flex items-center justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={handleClose} className="h-9 text-xs">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      disabled={updateMutation.isPending || !isDirty}
                      className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs gap-1.5"
                    >
                      {updateMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</> : <><Check className="h-3.5 w-3.5" /> Salvar</>}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </TabsContent>

            {/* ── Tab: Tipos de Cobrança ── */}
            <TabsContent value="tipos" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full px-4 sm:px-6">
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Contribuições e cadastros governamentais cobráveis
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={editingCharge === "new"}
                      onClick={() => setEditingCharge("new")}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Novo tipo
                    </Button>
                  </div>

                  {editingCharge !== null && (
                    <ChargeTypeForm
                      initial={editingCharge === "new" ? null : editingCharge}
                      isPending={chargeFormPending}
                      onSubmit={handleChargeSubmit}
                      onCancel={() => setEditingCharge(null)}
                    />
                  )}

                  {chargesContent}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

  );
}
