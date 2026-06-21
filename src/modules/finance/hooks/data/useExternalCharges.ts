import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { externalChargeService } from "../../services/externalChargeService";

export function useExternalCharges(cpf: string | null) {
  const { tenantId, bootstrapped } = useActiveScope();
  const queryClient = useQueryClient();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [reissuingLancId, setReissuingLancId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["finance", "external-charges", cpf, tenantId ?? null],
    queryFn: () => externalChargeService.getBySocio(cpf!, tenantId!),
    enabled: bootstrapped && !!tenantId && !!cpf,
    staleTime: 2 * 60 * 1000,
  });

  const syncMutation = useMutation({
    mutationFn: (fcxId: string) => {
      setSyncingId(fcxId);
      return externalChargeService.sync(tenantId!, fcxId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "external-charges", cpf] });
      toast.success("Cobrança sincronizada.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao sincronizar");
    },
    onSettled: () => setSyncingId(null),
  });

  const reissueMutation = useMutation({
    mutationFn: ({ lancamentoId, billingType, dueDate }: { lancamentoId: string; billingType: "BOLETO" | "PIX"; dueDate: string }) => {
      setReissuingLancId(lancamentoId);
      return externalChargeService.reissue(tenantId!, lancamentoId, billingType, dueDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "external-charges", cpf] });
      toast.success("Nova cobrança gerada.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao reemitir");
    },
    onSettled: () => setReissuingLancId(null),
  });

  const cancelMutation = useMutation({
    mutationFn: (fcxId: string) => {
      setCancellingId(fcxId);
      return externalChargeService.cancel(tenantId!, fcxId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "external-charges", cpf] });
      toast.success("Cobrança cancelada.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar");
    },
    onSettled: () => setCancellingId(null),
  });

  return {
    charges: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    sync: (fcxId: string) => syncMutation.mutate(fcxId),
    isSyncingId: (id: string) => syncingId === id,
    reissue: (lancamentoId: string, billingType: "BOLETO" | "PIX", dueDate: string) =>
      reissueMutation.mutate({ lancamentoId, billingType, dueDate }),
    isReissuingLancId: (lancId: string) => reissuingLancId === lancId,
    cancelCharge: (fcxId: string) => cancelMutation.mutate(fcxId),
    isCancellingId: (id: string) => cancellingId === id,
  };
}
