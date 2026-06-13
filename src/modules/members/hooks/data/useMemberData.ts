import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDataTableState } from "@/shared/hooks/useDataTableState";
import { memberService, type MemberUnitContext } from "../../services/memberService";
import { memberQueryKeys } from "../../queryKeys";
import { useMemberFilters } from "../filters/useMemberFilters";
import { useMemberActions } from "../edit/useMemberActions";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import type {
  MemberListItem,
  MemberSearchParams,
  StatusFilter,
  RgpStatusFilter,
} from "../../types/member.types";

export function useMemberData(
  params: MemberSearchParams & { enabled?: boolean },
  context?: MemberUnitContext,
) {
  const query = useQuery({
    queryKey: memberQueryKeys.list({ ...params, _unitId: context?.unitId ?? null }),
    queryFn: () => memberService.searchMembers(params, context),
    enabled: params.enabled !== false,
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

export function useMembersListController() {
  const { 
    page, setPage, 
    pageSize, setPageSize, 
    searchTerm, debouncedTerm, 
    setSearchTerm 
  } = useDataTableState({ initialPageSize: 10 });

  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "data_de_admissao",
    direction: "desc",
  });

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
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMemberUuid = searchParams.get("view");
  const isViewModalOpen = !!viewMemberUuid;

  const queryParams = useMemo<MemberSearchParams>(
    () => ({
      page,
      pageSize,
      searchTerm: debouncedTerm,
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
      debouncedTerm,
      statusFilter,
      localityFilter,
      birthMonthFilter,
      genderFilter,
      rgpStatusFilter,
      sortConfig,
    ],
  );

  const { tenantId, unitId, bootstrapped } = useActiveScope();
  const unitContext: MemberUnitContext = { tenantId, unitId };

  const { members, total, isLoading, isFetching, error, refetch } =
    useMemberData({ ...queryParams, enabled: bootstrapped && !!unitId }, unitContext);

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
    setSearchParams((prev) => { prev.set("view", member.id); return prev; });
  };
  const handleViewModalChange = (open: boolean) => {
    if (!open) {
      setSearchParams((prev) => { prev.delete("view"); return prev; });
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
      onChange: setSearchTerm,
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
      onPageSizeChange: setPageSize,
      onPreviousPage: () => setPage(page - 1),
      onNextPage: () => setPage(page + 1),
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
