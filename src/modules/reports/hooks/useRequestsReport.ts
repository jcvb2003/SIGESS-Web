import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService } from "../services/reportsService";
import { useState } from "react";
import { toast } from "sonner";
export function useRequestsReport(searchTerm: string, enabled = true) {
  const queryClient = useQueryClient();
  const [pageBySearch, setPageBySearch] = useState<Record<string, number>>({});
  const [pageSize, setPageSize] = useState(10);
  const page = pageBySearch[searchTerm] ?? 1;
  const setPage = (value: number) => {
    setPageBySearch((current) => ({ ...current, [searchTerm]: value }));
  };
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["requests-report", page, pageSize, searchTerm],
    queryFn: () =>
      reportsService.fetchRequestsReport(page, pageSize, searchTerm),
    enabled,
    placeholderData: (previousData) => previousData,
  });
  const deleteMutation = useMutation({
    mutationFn: reportsService.deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests-report"] });
      toast.success("Requerimento excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir requerimento");
      console.error(error);
    },
  });
  return {
    data: data?.data || [],
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / pageSize),
    page,
    pageSize,
    setPage,
    setPageSize,
    isLoading,
    isFetching,
    error,
    refetch,
    deleteRequest: deleteMutation.mutate,
  };
}
