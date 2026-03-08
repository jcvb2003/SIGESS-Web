export const reapQueryKeys = {
  all: ["reap"] as const,
  list: (filters: {
    searchTerm?: string;
    page: number;
    pageSize: number;
    statusFilter?: string;
  }) => [...reapQueryKeys.all, "list", filters] as const,
  detail: (cpf: string) => [...reapQueryKeys.all, "detail", cpf] as const,
};
