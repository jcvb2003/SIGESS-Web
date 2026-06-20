import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { externalChargeService } from "../../services/externalChargeService";

export function useExternalCharges(cpf: string | null) {
  const { tenantId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: ["finance", "external-charges", cpf, tenantId ?? null],
    queryFn: () => externalChargeService.getBySocio(cpf!, tenantId!),
    enabled: bootstrapped && !!tenantId && !!cpf,
    staleTime: 2 * 60 * 1000,
  });

  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: (fcxId: string) => externalChargeService.sync(tenantId!, fcxId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "external-charges", cpf] });
      toast.success("Cobrança sincronizada.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao sincronizar");
    },
  });

  const reissueMutation = useMutation({
    mutationFn: ({ lancamentoId, billingType, dueDate }: { lancamentoId: string; billingType: "BOLETO" | "PIX"; dueDate: string }) =>
      externalChargeService.reissue(tenantId!, lancamentoId, billingType, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "external-charges", cpf] });
      toast.success("Nova cobrança gerada.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao reemitir");
    },
  });

  return {
    charges: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    sync: (fcxId: string) => syncMutation.mutate(fcxId),
    isSyncing: syncMutation.isPending,
    reissue: (lancamentoId: string, billingType: "BOLETO" | "PIX", dueDate: string) =>
      reissueMutation.mutate({ lancamentoId, billingType, dueDate }),
    isReissuing: reissueMutation.isPending,
  };
}
