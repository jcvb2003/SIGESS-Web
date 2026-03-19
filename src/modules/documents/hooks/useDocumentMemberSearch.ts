import { useCallback, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
export interface DocumentMemberSearchResult {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  foto_url: string | null;
  codigo_do_socio: number | null;
}
export function useDocumentMemberSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const searchMembers = useCallback(
    async (term: string): Promise<DocumentMemberSearchResult[]> => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("socios")
          .select("id, nome, cpf, rg, codigo_do_socio")
          .order("nome")
          .limit(20);
        if (term) {
          const searchTerm = term.trim();
          query = query.or(
            `nome.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,codigo_do_socio.ilike.%${searchTerm}%`,
          );
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((item) => ({
          id: String(item.id),
          nome: String(item.nome),
          cpf: String(item.cpf),
          rg: String(item.rg || ""),
          foto_url: null,
          codigo_do_socio:
            item.codigo_do_socio && typeof item.codigo_do_socio === "number"
              ? item.codigo_do_socio
              : null,
        }));
      } catch (error) {
        console.error("Error searching members in documents:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );
  return { searchMembers, isLoading };
}
