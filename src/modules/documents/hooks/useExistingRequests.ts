import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDateOrDash } from "@/shared/utils/date";
import { documentService } from "../services/documentService";
import { documentQueryKeys } from "../queryKeys";
import type {
  DocumentSearchParams,
} from "../types/document.types";
export function useExistingRequests(params: DocumentSearchParams) {
  const query = useQuery({
    queryKey: documentQueryKeys.list(params),
    queryFn: async () => {
      const { data, error } = await documentService.listRequests(params);
      if (error) throw error;
      return data;
    },
  });
  return {
    documents: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
const DEFAULT_PAGE_SIZE = 10;
const formatCpf = (value: string | null): string => {
  if (!value) {
    return "-";
  }
  const digits = value.replaceAll(/\D/g, "");
  if (digits.length !== 11) {
    return value;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};
const getStatusLabel = (status: string | null): string => {
  if (!status) {
    return "Não informado";
  }
  return status;
};
export function useDocumentsListController() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const { documents, total, isLoading, isFetching, error, refetch } =
    useExistingRequests({
      page,
      pageSize,
      searchTerm,
    });
  const showingCount = useMemo(() => {
    if (!total) {
      return 0;
    }
    const max = page * pageSize;
    return Math.min(max, total);
  }, [page, pageSize, total]);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((current) => current - 1);
    }
  };
  const handleNextPage = () => {
    if (showingCount < total) {
      setPage((current) => current + 1);
    }
  };
  const handleNewDocument = () => {
  };
  const handleViewPdf = () => {
  };
  const handleReprint = () => {
  };
  const handleDelete = () => {
  };
  return {
    search: {
      value: searchTerm,
      onChange: handleSearchChange,
    },
    list: {
      documents,
      total,
      isLoading,
      isFetching,
      error,
      refetch,
    },
    pagination: {
      page,
      showingCount,
      onPreviousPage: handlePreviousPage,
      onNextPage: handleNextPage,
    },
    actions: {
      onNewDocument: handleNewDocument,
      onViewPdf: handleViewPdf,
      onReprint: handleReprint,
      onDelete: handleDelete,
    },
    formatters: {
      formatCpf,
      formatDate: formatDateOrDash,
      getStatusLabel,
    },
  };
}
