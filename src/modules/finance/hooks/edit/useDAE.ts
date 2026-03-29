import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { daeService } from "../../services/daeService";
import { toast } from "sonner";

export function useDAE() {
  const queryClient = useQueryClient();

  const updateBoleto = useMutation({
    mutationFn: ({
      id,
      pago,
      dataPagamento,
    }: {
      id: string;
      pago: boolean;
      dataPagamento?: string;
    }) => daeService.updateBoletoStatus(id, pago, dataPagamento),
    onSuccess: () => {
      toast.success("Status do boleto atualizado.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao atualizar status do boleto.");
    },
  });

  const cancelDAE = useMutation({
    mutationFn: (id: string) => daeService.cancelDAE(id),
    onSuccess: () => {
      toast.success("DAE cancelado com sucesso.");
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
    },
    onError: () => {
      toast.error("Erro ao cancelar DAE.");
    },
  });

  return { updateBoleto, cancelDAE };
}
