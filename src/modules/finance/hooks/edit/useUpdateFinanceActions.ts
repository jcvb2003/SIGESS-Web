import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";
import { daeService } from "../../services/daeService";
import { financeQueryKeys } from "../../queryKeys";
import type { FinanceLancamento, FinanceDAE } from "../../types/finance.types";
import { toast } from "sonner";

export function useUpdateFinanceActions() {
  const queryClient = useQueryClient();

  /**
   * Atualizar Lançamento (Modelo A: Cancelar Antigo + Criar Novo)
   */
  const updatePayment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceLancamento> }) => {
      // 1. Buscar o original para preservar campos não alterados
      const original = await financeService.getPayment(id);
      
      // 2. Cancelar o original com justificativa
      await financeService.cancelPayment(id, "Correção: Registro original substituído por novo lançamento corrigido.");
      
      // 3. Criar o novo registro (filtrando ID e data de criação para não dar erro no INSERT)
      const newData = Object.fromEntries(
        Object.entries(original).filter(([key]) => key !== 'id' && key !== 'created_at')
      ) as Partial<FinanceLancamento>;

      await financeService.createPayment({
        ...newData,
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("Lançamento corrigido com sucesso (Histórico preservado).");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao corrigir lançamento.");
    },
  });

  /**
   * Atualizar DAE (Modelo A: Cancelar Antigo + Criar Novo)
   */
  const updateDAE = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceDAE> }) => {
      // 1. Buscar o original
      const original = await daeService.getDAE(id);
      
      // 2. Cancelar o original
      await daeService.cancelDAE(id, "Correção: Repasse original substituído por novo registro corrigido.");
      
      // 3. Criar o novo
      const newData = Object.fromEntries(
        Object.entries(original).filter(([key]) => key !== 'id' && key !== 'created_at')
      ) as Partial<FinanceDAE>;

      await daeService.createDAE({
        ...newData,
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("DAE corrigido com sucesso (Histórico preservado).");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao corrigir DAE.");
    },
  });

  return {
    updatePayment,
    updateDAE,
  };
}
