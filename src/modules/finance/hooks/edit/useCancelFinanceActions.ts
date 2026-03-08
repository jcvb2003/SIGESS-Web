import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";
import { daeService } from "../../services/daeService";
import { financeQueryKeys } from "../../queryKeys";
import { toast } from "sonner";

export function useCancelFinanceActions() {
  const queryClient = useQueryClient();

  // Cancelar Lançamento (Anuidade, Taxas, etc)
  const cancelPayment = useMutation({
    mutationFn: ({ id, observation }: { id: string; observation: string }) =>
      financeService.cancelPayment(id, observation),
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
