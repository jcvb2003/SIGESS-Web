import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
interface Locality {
  id: string;
  name: string;
  code: string;
}
export function useLocalitiesData() {
  const {
    data: localities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["localities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("localidades")
        .select("id, nome, codigo_localidade")
        .order("nome", { ascending: true });
      if (error) {
        throw error;
      }
      return (data || []).map((item) => ({
        id: String(item.id),
        name: String(item.nome ?? ""),
        code: String(item.codigo_localidade ?? ""),
      }));
    },
    staleTime: 30 * 60 * 1000,
  });
  return {
    localities: (localities || []) as Locality[],
    loading: isLoading,
    refetch,
  };
}
