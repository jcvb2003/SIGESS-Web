import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";

import { useFinanceSettings } from "../../hooks/data/useFinanceSettings";
import { useChargeTypes } from "../../hooks/data/useChargeTypes";
import { 
  useUpdateFinanceSettings, 
  useChargeTypeMutations 
} from "../../hooks/edit/useUpdateMemberConfig";

import {
  financeSettingsSchema,
  type FinanceSettingsForm,
} from "../../schemas/financeSettings.schema";
import type { ChargeType } from "../../types/finance.types";
import type { ChargeTypeFormValues } from "../../schemas/chargeType.schema";

// Subcomponentes das abas
import { GeneralSettingsTab } from "./tabs/GeneralSettingsTab";
import { ChargeTypesTab } from "./tabs/ChargeTypesTab";
import { MemberFinanceSettingsTab } from "./tabs/MemberFinanceSettingsTab";

interface FinanceSettingsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function FinanceSettingsDialog({
  open,
  onOpenChange,
}: FinanceSettingsDialogProps) {
  // Data Fetching
  const { settings, isLoading: loadingSettings } = useFinanceSettings();
  const { chargeTypes, isLoading: loadingChargeTypes } = useChargeTypes();
  
  // Mutations
  const updateSettingsMutation = useUpdateFinanceSettings();
  const { createChargeType, updateChargeType, toggleActive, deleteChargeType } = useChargeTypeMutations();

  // Form para aba de Parâmetros
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
      anoBaseCobranca: new Date().getFullYear(),
      valorAnuidade: 0,
      valorMensalidade: 0,
      valorInscricao: 0,
      valorTransferencia: 0,
      bloquearInadimplente: false,
      anosAtrasoAlerta: 2,
    },
  });

  // Sincronizar dados iniciais
  useEffect(() => {
    if (!settings) return;
    reset({
      regimePadrao: (settings.regime_padrao as "anuidade" | "mensalidade") ?? "anuidade",
      diaVencimento: settings.dia_vencimento ?? 10,
      anoBaseCobranca: settings.ano_base_cobranca ?? new Date().getFullYear(),
      valorAnuidade: Number(settings.valor_anuidade),
      valorMensalidade: Number(settings.valor_mensalidade),
      valorInscricao: Number(settings.valor_inscricao),
      valorTransferencia: Number(settings.valor_transferencia),
      bloquearInadimplente: settings.bloquear_inadimplente ?? false,
      anosAtrasoAlerta: settings.anos_atraso_alerta ?? 2,
    });
  }, [settings, reset]);

  const handleClose = () => onOpenChange(false);

  // Handlers
  const handleSettingsSubmit = async (data: FinanceSettingsForm) => {
    if (!settings?.id) return;
    await updateSettingsMutation.mutateAsync({
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

  const handleChargeSubmit = async (data: ChargeTypeFormValues, editingCharge: ChargeType | "new") => {
    const payload = {
      categoria: data.categoria,
      nome: data.nome,
      descricao: data.descricao ?? null,
      valor_padrao: data.valorPadrao ?? null,
      obrigatoriedade: data.obrigatoriedade ?? null,
      ativo: data.ativo,
    };
    
    if (editingCharge === "new") {
      await createChargeType.mutateAsync(payload as Parameters<typeof createChargeType.mutateAsync>[0]);
    } else {
      await updateChargeType.mutateAsync({ id: editingCharge.id, updates: payload });
    }
  };

  const handleChargeDelete = async (id: string) => {
    await deleteChargeType.mutateAsync(id);
  };

  // Render Loader
  if (loadingSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 outline-none overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Configurações Financeiras
              </DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500 font-medium tracking-tight">
                Parâmetros globais e gestão de cobranças
              </p>
            </div>
          </DialogHeader>

          <Tabs defaultValue="parametros" className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 shrink-0 border-b">
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
                <TabsTrigger value="tipos">Tipos de Cobrança</TabsTrigger>
                <TabsTrigger value="socios">Configuração por Sócio</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="parametros" className="flex-1 overflow-hidden mt-0">
              <GeneralSettingsTab 
                control={control}
                isPending={updateSettingsMutation.isPending}
                isDirty={isDirty}
                onSubmit={handleSubmit(handleSettingsSubmit)}
                onCancel={handleClose}
              />
            </TabsContent>

            <TabsContent value="tipos" className="flex-1 overflow-hidden mt-0">
              <ChargeTypesTab 
                chargeTypes={chargeTypes}
                loadingChargeTypes={loadingChargeTypes}
                onChargeSubmit={handleChargeSubmit}
                onChargeDelete={handleChargeDelete}
                onToggleActive={(id, ativo) => toggleActive.mutate({ id, ativo })}
                isMutationPending={createChargeType.isPending || updateChargeType.isPending || deleteChargeType.isPending}
              />
            </TabsContent>

            <TabsContent value="socios" className="flex-1 overflow-hidden mt-0">
              <MemberFinanceSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
