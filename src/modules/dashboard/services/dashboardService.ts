import { supabase } from "@/shared/lib/supabase/client";
interface Member {
  id: string;
  nome: string;
  cpf?: string;
  created_at?: string;
  data_de_admissao?: string;
  data_de_nascimento?: string;
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
    acc.push({
      id: String(record.id),
      nome: String(record.nome),
      cpf: typeof record.cpf === "string" ? record.cpf : undefined,
      data_de_admissao:
        typeof record.data_de_admissao === "string"
          ? record.data_de_admissao
          : undefined,
      data_de_nascimento:
        typeof record.data_de_nascimento === "string"
          ? record.data_de_nascimento
          : undefined,
    });
    return acc;
  }, []);
};
async function fetchPhotosForMembers(members: Member[]): Promise<Member[]> {
  if (!members.length) return members as Member[];
  const cleanCpfs = members
    .map((m) => (m.cpf ? m.cpf.replace(/\D/g, "") : null))
    .filter(Boolean) as string[];
  const originalCpfs = members.map((m) => m.cpf).filter(Boolean) as string[];
  const allCpfs = Array.from(new Set([...cleanCpfs, ...originalCpfs]));
  if (!allCpfs.length) return members as Member[];
  const { data: photos, error } = await supabase
    .from("fotos")
    .select("cpf, foto_url")
    .in("cpf", allCpfs);
  if (error) {
    console.error("Error fetching photos:", error);
  }
  const photoMap = new Map<string, string>();
  photos?.forEach((p) => {
    if (p.cpf && p.foto_url) {
      const key = String(p.cpf).replace(/\D/g, "");
      photoMap.set(key, String(p.foto_url));
    }
  });
  return members.map((m) => {
    const cleanCpf = m.cpf ? m.cpf.replace(/\D/g, "") : "";
    const photoUrl = photoMap.get(cleanCpf);
    return {
      ...m,
      fotos: photoUrl ? [{ foto_url: photoUrl }] : [],
    };
  }) as Member[];
}
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
      return fetchPhotosForMembers(normalizeMembers(data));
    } catch (error) {
      console.error("Recent members error:", error);
      return [];
    }
  },
  async getBirthdayMembers(): Promise<Member[]> {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      const pageSize = 1000;
      const maxPages = 10;
      let page = 0;
      let hasMore = true;
      const allMembers: Member[] = [];
      while (hasMore && page < maxPages) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from("socios")
          .select("id, nome, data_de_nascimento, cpf")
          .not("data_de_nascimento", "is", null)
          .range(from, to);
        if (error) {
          console.error("Error fetching birthday members:", error);
          return [];
        }
        const normalizedPage = normalizeMembers(data);
        allMembers.push(...normalizedPage);
        hasMore = normalizedPage.length === pageSize;
        page += 1;
      }
      const filteredMembers = allMembers
        .filter((member) => {
          if (!member.data_de_nascimento) return false;
          const parts = member.data_de_nascimento.split("-");
          if (parts.length !== 3) return false;
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          return month === currentMonth && day === currentDay;
        })
        .sort((a, b) => {
          return a.nome.localeCompare(b.nome);
        });
      return fetchPhotosForMembers(filteredMembers);
    } catch (error) {
      console.error("Birthday members error:", error);
      return [];
    }
  },
};
