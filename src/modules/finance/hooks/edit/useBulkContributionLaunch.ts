import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { generatedChargesService } from "../../services/generatedChargesService";
import { toast } from "sonner";

export function useBulkContributionLaunch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chargeTypeId: string) =>
      generatedChargesService.launchBulk(chargeTypeId),
    onSuccess: (count) => {
      toast.success(`${count} pendência(s) gerada(s) com sucesso.`);
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao lançar contribuição em massa.");
    },
  });
}
