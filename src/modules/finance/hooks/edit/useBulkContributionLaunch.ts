import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { generatedChargesService } from "../../services/generatedChargesService";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useBulkContributionLaunch() {
  const queryClient = useQueryClient();
  const { unitId } = useActiveScope();

  return useMutation({
    mutationFn: (chargeTypeId: string) =>
      generatedChargesService.launchBulk(chargeTypeId, unitId),
    onSuccess: (count) => {
      toast.success(`${count} pendência(s) gerada(s) com sucesso.`);
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao lançar contribuição em massa.");
    },
  });
}
