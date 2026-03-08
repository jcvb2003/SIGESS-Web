import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { memberFinanceConfigService } from "../../services/memberFinanceConfigService";
import { financeSettingsService } from "../../services/financeSettingsService";
import { chargeTypesService } from "../../services/chargeTypesService";
import type { FinanceConfig, FinanceSettings, ChargeType } from "../../types/finance.types";
import { toast } from "sonner";

export function useUpdateMemberConfig() {
  const queryClient = useQueryClient();

  const updateConfig = useMutation({
    mutationFn: ({ cpf, updates }: { cpf: string; updates: Partial<FinanceConfig> }) =>
      memberFinanceConfigService.upsertConfig(cpf, updates),
    onSuccess: () => {
      toast.success("Configuração atualizada.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao atualizar configuração.");
    },
  });

  const updateRegime = useMutation({
    mutationFn: ({
      cpf,
      regime,
      observation,
    }: {
      cpf: string;
      regime: string;
      observation?: string;
    }) => memberFinanceConfigService.updateRegime(cpf, regime, observation),
    onSuccess: () => {
      toast.success("Regime atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao atualizar regime.");
    },
  });

  return { updateConfig, updateRegime };
}

export function useUpdateFinanceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FinanceSettings> }) =>
      financeSettingsService.updateSettings(id, updates),
    onSuccess: () => {
      toast.success("Parâmetros financeiros atualizados.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.settings() });
    },
    onError: () => {
      toast.error("Erro ao atualizar parâmetros.");
    },
  });
}

export function useChargeTypeMutations() {
  const queryClient = useQueryClient();

  const createChargeType = useMutation({
    mutationFn: (charge: Omit<ChargeType, "id" | "created_at" | "updated_at">) =>
      chargeTypesService.create(charge),
    onSuccess: () => {
      toast.success("Tipo de cobrança criado.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.chargeTypes() });
    },
    onError: () => {
      toast.error("Erro ao criar tipo de cobrança.");
    },
  });

  const updateChargeType = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ChargeType> }) =>
      chargeTypesService.update(id, updates),
    onSuccess: () => {
      toast.success("Tipo de cobrança atualizado.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.chargeTypes() });
    },
    onError: () => {
      toast.error("Erro ao atualizar tipo de cobrança.");
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      chargeTypesService.toggleActive(id, ativo),
    onSuccess: () => {
      toast.success("Status alterado.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.chargeTypes() });
    },
    onError: () => {
      toast.error("Erro ao alterar status.");
    },
  });

  const deleteChargeType = useMutation({
    mutationFn: (id: string) => chargeTypesService.delete(id),
    onSuccess: () => {
      toast.success("Tipo de cobrança excluído.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.chargeTypes() });
    },
    onError: (error: any) => {
      // Postgres Error code 23503 is Foreign Key Violation
      if (error?.code === "23503") {
        toast.error("Este tipo de cobrança não pode ser excluído pois está em uso.");
      } else {
        toast.error("Erro ao excluir tipo de cobrança.");
      }
    },
  });

  return { createChargeType, updateChargeType, toggleActive, deleteChargeType };
}
