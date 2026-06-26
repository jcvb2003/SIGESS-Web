import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";
import { daeService } from "../../services/daeService";
import { financeQueryKeys } from "../../queryKeys";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useCancelFinanceActions() {
  const queryClient = useQueryClient();
  const { tenantId } = useActiveScope();

  // Cancelar Lançamento (Anuidade, Taxas, etc)
  const cancelPayment = useMutation({
    mutationFn: ({ id, observation }: { id: string; observation: string }) =>
      financeService.cancelPayment(id, observation, tenantId),
    onSuccess: () => {
      toast.success("Lançamento cancelado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao cancelar lançamento.");
    },
  });

  // Cancelar DAE
  const cancelDAE = useMutation({
    mutationFn: ({ id, observation }: { id: string; observation: string }) =>
      daeService.cancelDAE(id, observation),
    onSuccess: () => {
      toast.success("DAE cancelado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao cancelar DAE.");
    },
  });

  return {
    cancelPayment,
    cancelDAE,
  };
}
