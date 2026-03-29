import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import { toast } from "sonner";

export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
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
}
