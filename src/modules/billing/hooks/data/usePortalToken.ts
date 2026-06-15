import { useQuery } from "@tanstack/react-query";
import { fetchPortalToken } from "../../services/portalService";

export function usePortalToken(token: string | undefined) {
  const query = useQuery({
    queryKey: ["billing", "portal-token", token],
    queryFn: () => fetchPortalToken(token!),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
