import { supabase } from "@/shared/lib/supabase/client";
import { photoService } from "@/modules/members/services/photoService";

interface Member {
  id: string;
  nome: string;
  cpf?: string;
  created_at?: string;
  data_de_admissao?: string;
  data_de_nascimento?: string;
  foto_url?: string | null;
  fotos?:
    | {
        foto_url: string;
      }[]
    | null;
}
const normalizeMembers = (value: unknown): Member[] => {
  if (!Array.isArray(value)) return [];
  return value.reduce<Member[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const record = item as Record<string, unknown>;
    if (!record.id || !record.nome) return acc;
    
    const cpf = typeof record.cpf === "string" ? record.cpf : undefined;
    const photoUrl = cpf ? photoService.getPhotoUrl(cpf) : null;

    acc.push({
      id: String(record.id),
      nome: String(record.nome),
      cpf,
      data_de_admissao:
        typeof record.data_de_admissao === "string"
          ? record.data_de_admissao
          : undefined,
      data_de_nascimento:
        typeof record.data_de_nascimento === "string"
          ? record.data_de_nascimento
          : undefined,
      foto_url: photoUrl,
      fotos: photoUrl ? [{ foto_url: photoUrl }] : [],
    });
    return acc;
  }, []);
};
export const dashboardService = {
  async getStats() {
    try {
      const [totalResponse, maleResponse, femaleResponse, documentsResponse] =
        await Promise.all([
          supabase.from("socios").select("*", { count: "exact", head: true }),
          supabase
            .from("socios")
            .select("*", { count: "exact", head: true })
            .eq("sexo", "MASCULINO"),
          supabase
            .from("socios")
            .select("*", { count: "exact", head: true })
            .eq("sexo", "FEMININO"),
          supabase.from("requerimentos").select("*", { count: "exact", head: true }),
        ]);
      return {
        totalMembers: totalResponse.count || 0,
        maleMembers: maleResponse.count || 0,
        femaleMembers: femaleResponse.count || 0,
        totalDocuments: documentsResponse.count || 0,
      };
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return {
        totalMembers: 0,
        maleMembers: 0,
        femaleMembers: 0,
        totalDocuments: 0,
      };
    }
  },
  async getRecentMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from("socios")
        .select("id, nome, data_de_admissao, cpf")
        .order("data_de_admissao", { ascending: false })
        .limit(5);
      if (error) {
        console.error("Error fetching recent members:", error);
        return [];
      }
      return normalizeMembers(data);
    } catch (error) {
      console.error("Recent members error:", error);
      return [];
    }
  },
  async getBirthdayMembers(): Promise<Member[]> {
    try {
      const today = new Date();

      const { data, error } = await supabase
        .rpc('get_birthday_members', {
          p_day: today.getDate(),
          p_month: today.getMonth() + 1
        });

      if (error) {
        console.error("Error fetching birthday members via RPC:", error);
        return [];
      }

      return normalizeMembers(data);
    } catch (error) {
      console.error("Birthday members error:", error);
      return [];
    }
  },
};
