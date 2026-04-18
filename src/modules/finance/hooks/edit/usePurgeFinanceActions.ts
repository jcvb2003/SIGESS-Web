import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { toast } from "sonner";
import { financeQueryKeys } from "../../queryKeys";

export function usePurgeFinanceActions() {
  const queryClient = useQueryClient();

  const purgePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("purge_payment_v1", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-audit-log"] });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      toast.success("Lançamento excluído permanentemente com sucesso.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir lançamento: ${error.message}`);
    },
  });

  const purgeBulk = useMutation({
    mutationFn: async (days: number) => {
      const { data, error } = await supabase.rpc("purge_cancelled_bulk_v1", {
        p_older_than_days: days,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["finance-audit-log"] });
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      toast.success(`${count} registros excluídos permanentemente.`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na limpeza em massa: ${error.message}`);
    },
  });

  return {
    purgePayment: purgePayment.mutateAsync,
    isPurgingPayment: purgePayment.isPending,
    purgeBulk: purgeBulk.mutateAsync,
    isPurgingBulk: purgeBulk.isPending,
  };
}
