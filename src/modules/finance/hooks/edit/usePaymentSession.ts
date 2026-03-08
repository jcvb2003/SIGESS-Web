import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import type { PaymentSessionPayload } from "../../types/finance.types";
import { toast } from "sonner";

export function usePaymentSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentSessionPayload) =>
      financeService.createPaymentSession(payload),
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao registrar pagamento. Tente novamente.");
    },
  });
}
