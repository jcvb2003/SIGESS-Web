import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { collectionConfigService, type CollectionConfigUpdate } from "../../services/collectionConfigService";

export function useUpdateCollectionConfig() {
  const queryClient = useQueryClient();
  const { tenantId } = useActiveScope();

  return useMutation({
    mutationFn: (values: CollectionConfigUpdate) => {
      if (!tenantId) throw new Error("Tenant não disponível");
      return collectionConfigService.upsertConfig(tenantId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "collection-config", tenantId] });
      toast.success("Configuração de recebimento salva.");
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erro ao salvar configuração";
      toast.error(msg);
    },
  });
}
