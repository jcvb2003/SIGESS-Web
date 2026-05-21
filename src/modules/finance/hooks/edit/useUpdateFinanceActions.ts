import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";
import { daeService } from "../../services/daeService";
import { financeQueryKeys } from "../../queryKeys";
import type {
  FinanceLancamento,
  FinanceDAE,
  FinanceLancamentoInsert,
} from "../../types/finance.types";
import { toast } from "sonner";

export function useUpdateFinanceActions() {
  const queryClient = useQueryClient();

  /**
   * Atualizar Lançamento (Modelo A: Cancelar Antigo + Criar Novo)
   */
  const updatePayment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceLancamento> }) => {
      const original = await financeService.getPayment(id);

      await financeService.cancelPayment(
        id,
        "Correcao: Registro original substituido por novo lancamento corrigido.",
      );

      const newData = Object.fromEntries(
        Object.entries(original).filter(([key]) => key !== "id" && key !== "created_at"),
      ) as Partial<FinanceLancamento>;

      await financeService.createPayment({
        ...newData,
        ...data,
      } as FinanceLancamentoInsert);
    },
    onSuccess: () => {
      toast.success("Lançamento corrigido com sucesso (histórico preservado).");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao corrigir lançamento.");
    },
  });

  /**
   * Atualizar metadados do DAE.
   */
  const updateDAE = useMutation({
    mutationFn: async ({
      id,
      grupoId,
      data,
    }: {
      id?: string;
      grupoId?: string;
      data: Partial<FinanceDAE>;
    }) => {
      if (grupoId) {
        await daeService.updateGroupDAEFields(grupoId, data);
        return;
      }

      if (!id) {
        throw new Error("DAE sem identificador para atualizacao.");
      }

      await daeService.updateDAE(id, data);
    },
    onSuccess: () => {
      toast.success("DAE atualizado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao atualizar DAE.");
    },
  });

  /**
   * Atualizar Grupo de DAE (Atomicamente via RPC)
   */
  const updateGroupDAE = useMutation({
    mutationFn: async ({
      grupoId,
      year,
      items,
    }: {
      grupoId: string;
      year: number;
      items: { mes: number; valor: number }[];
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
    mutationFn: async ({
      id,
      pago,
      dataPagamento,
    }: {
      id: string;
      pago: boolean;
      dataPagamento?: string;
    }) => {
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
