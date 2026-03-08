import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService } from "../services/documentService";
import { toast } from "sonner";

export function useRequestManagement(memberCpf?: string) {
  const queryClient = useQueryClient();
  type SaveRequestPayload = Parameters<typeof documentService.saveRequest>[0];

  const { data: savedRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["documents", "request", memberCpf],
    queryFn: async () => {
      if (!memberCpf) return null;
      const { data, error } =
        await documentService.getRequestByMember(memberCpf);
      if (error) throw error;
      return data;
    },
    enabled: !!memberCpf,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SaveRequestPayload) => {
      const { data: result, error } = await documentService.saveRequest(data);
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["documents", "request", memberCpf], data);
      toast.success("Requerimento salvo com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar requerimento.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await documentService.deleteRequest(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["documents", "request", memberCpf], null);
      toast.success("Requerimento excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir requerimento.");
    },
  });
  return {
    savedRequest,
    isLoadingRequest,
    saveRequest: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteRequest: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
