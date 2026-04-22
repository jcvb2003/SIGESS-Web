import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { memberService } from "../../services/memberService";
import { memberQueryKeys } from "../../queryKeys";
import { useMemberSearch } from "../search/useMemberSearch";
import { useMemberFilters } from "../filters/useMemberFilters";
import { useMemberActions } from "../edit/useMemberActions";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type {
  MemberListItem,
  MemberSearchParams,
  StatusFilter,
  RgpStatusFilter,
} from "../../types/member.types";
export function useMemberData(params: MemberSearchParams) {
  const query = useQuery({
    queryKey: memberQueryKeys.list(params),
    queryFn: () => memberService.searchMembers(params),
  });
  return {
    members: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
const DEFAULT_PAGE_SIZE = 10;
export function useMembersListController() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "data_de_admissao",
    direction: "desc",
  });

  const { searchTerm, setSearchTerm, handleSearchChange } = useMemberSearch();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    statusFilter,
    setStatusFilter,
    localityFilter,
    setLocalityFilter,
    birthMonthFilter,
    setBirthMonthFilter,
    genderFilter,
    setGenderFilter,
    rgpStatusFilter,
    setRgpStatusFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
    localities,
  } = useMemberFilters();
  const {
    isDeleteDialogOpen,
    isDeleting,
    openDeleteDialog,
    handleDeleteDialogChange,
    confirmDelete,
  } = useMemberActions();
  const navigate = useNavigate();
  const [viewMemberUuid, setViewMemberUuid] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const queryParams = useMemo<MemberSearchParams>(
    () => ({
      page,
      pageSize,
      searchTerm: debouncedSearchTerm,
      statusFilter,
      localityCode: localityFilter,
      birthMonth: birthMonthFilter,
      gender: genderFilter,
      rgpStatus: rgpStatusFilter,
      orderBy: sortConfig.field,
      orderDirection: sortConfig.direction,
    }),
    [
      page,
      pageSize,
      debouncedSearchTerm,
      statusFilter,
      localityFilter,
      birthMonthFilter,
      genderFilter,
      rgpStatusFilter,
      sortConfig,
    ],
  );

  const { members, total, isLoading, isFetching, error, refetch } =
    useMemberData(queryParams);

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const showingCount = useMemo(() => {
    if (!total) {
      return 0;
    }
    const max = page * pageSize;
    return Math.min(max, total);
  }, [page, pageSize, total]);

  const startIndex = useMemo(() => {
    if (total === 0) {
      return 0;
    }
    return (page - 1) * pageSize + 1;
  }, [page, pageSize, total]);

  const totalPages = useMemo(() => {
    if (total === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const handleSearchValueChange = (value: string) => {
    handleSearchChange(value);
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

  const handlePageSizeChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPageSize(parsed);
      setPage(1);
    }
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleLocalityFilterChange = (value: string) => {
    setLocalityFilter(value);
    setPage(1);
  };

  const handleBirthMonthChange = (value: string) => {
    setBirthMonthFilter(value);
    setPage(1);
  };

  const handleGenderChange = (value: string) => {
    setGenderFilter(value);
    setPage(1);
  };

  const handleRgpStatusChange = (value: string) => {
    setRgpStatusFilter(value as RgpStatusFilter);
    setPage(1);
  };
  const handleClearFilters = () => {
    clearFilters();
    setSearchTerm("");
    setPage(1);
  };
  const handleEdit = (member: MemberListItem) => {
    navigate(`/members/${member.id}`);
  };
  const handleView = (member: MemberListItem) => {
    setViewMemberUuid(member.id);
    setIsViewModalOpen(true);
  };
  const handleViewModalChange = (open: boolean) => {
    setIsViewModalOpen(open);
    if (!open) {
      setTimeout(() => setViewMemberUuid(null), 300);
    }
  };
  const handleGenerateDocument = (member: MemberListItem) => {
    navigate("/documents", {
      state: {
        member: {
          id: member.id,
          nome: member.nome,
          cpf: member.cpf,
          rg: "",
        },
      },
    });
  };
  const handleDelete = (member: MemberListItem) => {
    openDeleteDialog(member);
  };
  return {
    search: {
      value: searchTerm,
      onChange: handleSearchValueChange,
      onOpenFilters: () => setIsFiltersOpen(true),
    },
    table: {
      members,
      isLoading,
      isFetching,
      error,
      refetch,
      sortConfig,
      onSort: handleSort,
      onView: handleView,
      onEdit: handleEdit,
      onDocuments: handleGenerateDocument,
      onDelete: handleDelete,
    },
    pagination: {
      total,
      page,
      pageSize,
      showingCount,
      startIndex,
      totalPages,
      isLoading,
      isFetching,
      onPageSizeChange: handlePageSizeChange,
      onPreviousPage: handlePreviousPage,
      onNextPage: handleNextPage,
    },
    filterPanel: {
      open: isFiltersOpen,
      onOpenChange: setIsFiltersOpen,
      statusFilter,
      onStatusChange: handleStatusFilterChange,
      localityFilter,
      onLocalityChange: handleLocalityFilterChange,
      birthMonthFilter,
      onBirthMonthChange: handleBirthMonthChange,
      genderFilter,
      onGenderChange: handleGenderChange,
      rgpStatusFilter,
      onRgpStatusChange: handleRgpStatusChange,
      localities,
      onClear: handleClearFilters,
      onApply: () => setIsFiltersOpen(false),
    },
    deleteDialog: {
      open: isDeleteDialogOpen,
      onOpenChange: handleDeleteDialogChange,
      onConfirm: confirmDelete,
      isDeleting,
    },
    viewDialog: {
      open: isViewModalOpen,
      onOpenChange: handleViewModalChange,
      memberUuid: viewMemberUuid,
    },
  };
}
