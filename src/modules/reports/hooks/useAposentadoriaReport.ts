import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { reportsService } from "../services/reportsService";

export function useAposentadoriaReport(
  searchTerm: string,
  aposentadoriaFilter: string,
) {
  const { tenantId, unitId, bootstrapped } = useActiveScope();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => { setPage(1); }, [searchTerm, aposentadoriaFilter]);

  const query = useQuery({
    queryKey: ['reports', 'aposentadoria', page, pageSize, searchTerm, aposentadoriaFilter, unitId],
    queryFn: () => reportsService.fetchAposentadoriaReport(
      page, pageSize, searchTerm, aposentadoriaFilter, unitId ?? null,
    ),
    enabled: bootstrapped && !!tenantId,
    placeholderData: (prev) => prev,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    data: query.data?.data ?? [],
    total,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    page,
    pageSize,
    setPage,
    setPageSize,
  };
}
