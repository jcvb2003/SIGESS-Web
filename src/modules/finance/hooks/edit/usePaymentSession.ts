import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import type { PaymentSessionPayload } from "../../types/finance.types";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function usePaymentSession() {
  const queryClient = useQueryClient();
  const { tenantId } = useActiveScope();

  return useMutation({
    mutationFn: (payload: PaymentSessionPayload) =>
      financeService.createPaymentSession(payload, tenantId),
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao registrar pagamento. Tente novamente.");
    },
  });
}
