import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";
import { daeService } from "../../services/daeService";
import { financeQueryKeys } from "../../queryKeys";
import type { FinanceLancamento, FinanceDAE, FinanceLancamentoInsert, FinanceDAEInsert } from "../../types/finance.types";
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
      } as FinanceLancamentoInsert);
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
      } as FinanceDAEInsert);
    },
    onSuccess: () => {
      toast.success("DAE corrigido com sucesso (Histórico preservado).");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao corrigir DAE.");
    },
  });

  /**
   * Atualizar Grupo de DAE (Atomicamente via RPC)
   */
  const updateGroupDAE = useMutation({
    mutationFn: async ({ 
      grupoId, 
      year, 
      items 
    }: { 
      grupoId: string; 
      year: number; 
      items: { mes: number; valor: number }[] 
    }) => {
      await daeService.updateGroupDAE(grupoId, year, items);
    },
    onSuccess: () => {
      toast.success("Boleto agrupado atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: (error) => {
      console.error("Erro ao atualizar grupo:", error);
      toast.error("Erro ao atualizar boleto agrupado.");
    },
  });

  /**
   * Alternar Status do Boleto (Pago/Pendente)
   */
  const toggleBoletoStatus = useMutation({
    mutationFn: async ({ id, pago, dataPagamento }: { id: string; pago: boolean; dataPagamento?: string }) => {
      await daeService.updateBoletoStatus(id, pago, dataPagamento);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.pago ? "Boleto marcado como pago." : "Pagamento do boleto removido.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao atualizar status do boleto.");
    },
  });

  return {
    updatePayment,
    updateDAE,
    updateGroupDAE,
    toggleBoletoStatus,
  };
}
