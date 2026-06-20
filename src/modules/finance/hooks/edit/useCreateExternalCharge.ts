import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { financeService } from "../../services/financeService";
import { externalChargeService } from "../../services/externalChargeService";
import { financeQueryKeys } from "../../queryKeys";

export function useCreateExternalCharge(socioCpf: string | null) {
  const { tenantId } = useActiveScope();
  const queryClient = useQueryClient();

  // Persiste o lancamentoId criado no passo 1 entre tentativas.
  // Se o provider falhar, o retry reutiliza o mesmo lançamento sem criar duplicata.
  const [pendingLancamentoId, setPendingLancamentoId] = useState<string | null>(null);

  const invalidate = () => {
    if (!socioCpf) return;
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.statement(socioCpf) });
    queryClient.invalidateQueries({
      queryKey: ["finance", "external-charges", socioCpf, tenantId ?? null],
    });
  };

  const mutation = useMutation({
    mutationFn: async ({
      item,
      billingType,
      dueDate,
    }: {
      item: { valor: number; competencia_ano: number; competencia_mes: number };
      billingType: "BOLETO" | "PIX";
      dueDate: string;
    }) => {
      if (!socioCpf || !tenantId) throw new Error("Escopo inválido");

      // Retry: reutiliza lancamento criado em tentativa anterior
      const lancamentoId =
        pendingLancamentoId ??
        await financeService.createPendingLancamento({
          socio_cpf: socioCpf,
          tipo: "mensalidade",
          forma_pagamento: billingType === "PIX" ? "pix" : "boleto",
          ...item,
        });

      // Persistir antes de chamar o provider — garante que retry pule o passo 1
      setPendingLancamentoId(lancamentoId);

      return externalChargeService.createCharge(tenantId, lancamentoId, billingType, dueDate);
    },
    onSuccess: (result) => {
      setPendingLancamentoId(null);
      invalidate();
      if (result.paymentUrl) {
        const url = result.paymentUrl;
        toast.success("Cobrança gerada.", {
          action: { label: "Abrir", onClick: () => window.open(url, "_blank") },
        });
      } else {
        toast.success("Cobrança PIX gerada. Veja os detalhes no extrato.");
      }
    },
    onError: (err: unknown) => {
      // Lançamento pode ter sido criado (pendente) — invalidar para aparecer no extrato
      // pendingLancamentoId preservado para retry reutilizar o mesmo lançamento
      invalidate();
      toast.error(
        "Lançamento criado, mas cobrança falhou. Tente novamente ou veja o extrato para reemitir.",
      );
      console.error("[useCreateExternalCharge]", err);
    },
  });

  return {
    ...mutation,
    clearPendingLancamento: () => setPendingLancamentoId(null),
  };
}
