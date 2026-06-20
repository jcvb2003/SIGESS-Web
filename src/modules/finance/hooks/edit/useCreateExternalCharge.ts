import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { financeService } from "../../services/financeService";
import { externalChargeService } from "../../services/externalChargeService";
import { financeQueryKeys } from "../../queryKeys";

export function useCreateExternalCharge(socioCpf: string) {
  const { tenantId } = useActiveScope();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: financeQueryKeys.statement(socioCpf) });
    queryClient.invalidateQueries({
      queryKey: ["finance", "external-charges", socioCpf, tenantId ?? null],
    });
  };

  return useMutation({
    mutationFn: async ({
      item,
      billingType,
      dueDate,
    }: {
      item: { valor: number; competencia_ano: number; competencia_mes: number };
      billingType: "BOLETO" | "PIX";
      dueDate: string;
    }) => {
      const formaPagemento = billingType === "PIX" ? "pix" : "boleto";
      const lancamentoId = await financeService.createPendingLancamento({
        socio_cpf: socioCpf,
        tipo: "mensalidade",
        forma_pagamento: formaPagemento,
        ...item,
      });
      return externalChargeService.createCharge(tenantId!, lancamentoId, billingType, dueDate);
    },
    onSuccess: (result) => {
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
      invalidate();
      toast.error(
        err instanceof Error
          ? err.message
          : "Lançamento criado, mas cobrança falhou. Veja o extrato para reemitir.",
      );
      // Modal NÃO fecha — estado preservado para o operador
    },
  });
}
