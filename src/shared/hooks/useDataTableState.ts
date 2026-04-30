import { useState, useCallback } from "react";
import { useDebounce } from "./useDebounce";

interface UseDataTableStateProps {
  readonly initialPage?: number;
  readonly initialPageSize?: number;
  readonly initialSearchTerm?: string;
  readonly debounceDelay?: number;
}

export function useDataTableState({
  initialPage = 1,
  initialPageSize = 10,
  initialSearchTerm = "",
  debounceDelay = 300,
}: UseDataTableStateProps = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const debouncedTerm = useDebounce(searchTerm, debounceDelay);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const handlePageSizeChange = useCallback((newSize: string | number) => {
    const size = typeof newSize === "string" ? Number(newSize) : newSize;
    if (!Number.isNaN(size) && size > 0) {
      setPageSize(size);
      setPage(1);
    }
  }, []);

  return {
    page,
    setPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    searchTerm,
    setSearchTerm: handleSearchChange,
    debouncedTerm,
  };
}

