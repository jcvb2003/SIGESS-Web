import { keepPreviousData, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { externalChargeService, type ExternalChargesListFilters } from "../../services/externalChargeService";

type ListFilters = Omit<ExternalChargesListFilters, "unitId">;

const LIST_KEY = (tenantId: string | null, unitId: string | null, filters: ListFilters) =>
  ["finance", "external-charges-list", tenantId, unitId, filters] as const;

export function useExternalChargesList(filters: ListFilters) {
  const { tenantId, unitId, bootstrapped } = useActiveScope();
  const filtersWithUnit: ExternalChargesListFilters = { ...filters, unitId };

  const query = useQuery({
    queryKey: LIST_KEY(tenantId ?? null, unitId ?? null, filters),
    queryFn: () => externalChargeService.getList(tenantId!, filtersWithUnit),
    enabled: bootstrapped && !!tenantId,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["finance", "external-charges-list", tenantId, unitId],
    });

  const syncMutation = useMutation({
    mutationFn: (fcxId: string) => externalChargeService.sync(tenantId!, fcxId),
    onSuccess: () => { invalidate(); toast.success("Cobrança sincronizada."); },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao sincronizar"),
  });

  const reissueMutation = useMutation({
    mutationFn: ({ lancamentoId, billingType, dueDate }: { lancamentoId: string; billingType: "BOLETO" | "PIX"; dueDate: string }) =>
      externalChargeService.reissue(tenantId!, lancamentoId, billingType, dueDate),
    onSuccess: () => { invalidate(); toast.success("Nova cobrança gerada."); },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao reemitir"),
  });

  const cancelMutation = useMutation({
    mutationFn: (fcxId: string) => externalChargeService.cancel(tenantId!, fcxId),
    onSuccess: () => { invalidate(); toast.success("Cobrança cancelada."); },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao cancelar"),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    sync: (fcxId: string) => syncMutation.mutate(fcxId),
    isSyncing: syncMutation.isPending,
    syncingId: syncMutation.variables as string | undefined,
    reissue: (lancamentoId: string, billingType: "BOLETO" | "PIX", dueDate: string) =>
      reissueMutation.mutate({ lancamentoId, billingType, dueDate }),
    isReissuing: reissueMutation.isPending,
    reissuingLancId: (reissueMutation.variables as { lancamentoId: string } | undefined)?.lancamentoId,
    cancelCharge: (fcxId: string) => cancelMutation.mutate(fcxId),
    isCancelling: cancelMutation.isPending,
    cancellingId: cancelMutation.variables as string | undefined,
  };
}
