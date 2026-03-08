import { supabase } from "@/shared/lib/supabase/client";
import { Reap, ReapAnoAnual, ReapAnoSimplificado, ReapWithMember } from "../types/reap.types";

export const reapService = {
  async list(filters: {
    searchTerm?: string;
    page: number;
    pageSize: number;
    statusFilter?: string;
  }): Promise<{ items: ReapWithMember[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;

    let query = supabase
      .from("socios")
      .select(
        `
        cpf,
        nome,
        emissao_rgp,
        reap (
          simplificado,
          anual,
          updated_at
        )
      `,
        { count: "exact" }
      );

    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`cpf.ilike.${term},nome.ilike.${term}`);
    }

    // Filtro de status: filtra sócios que têm pelo menos um registro REAP com o status solicitado
    if (filters.statusFilter && filters.statusFilter !== "todos") {
      if (filters.statusFilter === "tem_problema") {
        // Sócios que têm reap cadastrado (filtro mais específico aplicado no cliente)
        query = query.not("reap", "is", null);
      } else if (filters.statusFilter === "sem_reap") {
        query = query.is("reap", null);
      }
    }

    const { data, error, count } = await query
      .order("nome", { ascending: true })
      .range(from, to);

    if (error) throw error;

    const items: ReapWithMember[] = (data || []).map((socio) => {
      const reapRecord = Array.isArray(socio.reap) ? socio.reap[0] : socio.reap;
      return {
        cpf: socio.cpf!,
        member_nome: socio.nome ?? null,
        emissao_rgp: socio.emissao_rgp ?? null,
        simplificado: (reapRecord?.simplificado as Reap["simplificado"]) ?? {},
        anual: (reapRecord?.anual as Reap["anual"]) ?? {},
        updated_at: reapRecord?.updated_at ?? "",
      };
    });

    return { items, total: count ?? 0 };
  },

  async getByCpf(cpf: string): Promise<ReapWithMember | null> {
    const { data, error } = await supabase
      .from("socios")
      .select(
        `
        cpf,
        nome,
        emissao_rgp,
        reap (
          simplificado,
          anual,
          updated_at
        )
      `
      )
      .eq("cpf", cpf)
      .maybeSingle();

    if (error || !data) return null;

    const reapRecord = Array.isArray(data.reap) ? data.reap[0] : data.reap;
    return {
      cpf: data.cpf!,
      member_nome: data.nome ?? null,
      emissao_rgp: data.emissao_rgp ?? null,
      simplificado: (reapRecord?.simplificado as Reap["simplificado"]) ?? {},
      anual: (reapRecord?.anual as Reap["anual"]) ?? {},
      updated_at: reapRecord?.updated_at ?? "",
    };
  },

  async upsertSimplificadoYear(
    cpf: string,
    ano: number,
    data: Partial<ReapAnoSimplificado>
  ): Promise<void> {
    // Garante que o registro base existe
    await supabase
      // @ts-expect-error PENDING TYPE GEN
      .from("reap")
      .upsert({ cpf }, { onConflict: "cpf", ignoreDuplicates: true });

    // Atualiza apenas o ano específico no JSONB usando jsonb_set no banco
    // @ts-expect-error PENDING TYPE GEN
    const { error } = await supabase.rpc("reap_upsert_simplificado_ano", {
      p_cpf: cpf,
      p_ano: String(ano),
      p_data: data,
    });

    if (error) throw error;
  },

  async upsertAnualYear(
    cpf: string,
    ano: number,
    data: Partial<ReapAnoAnual>
  ): Promise<void> {
    await supabase
      // @ts-expect-error PENDING TYPE GEN
      .from("reap")
      .upsert({ cpf }, { onConflict: "cpf", ignoreDuplicates: true });

    // @ts-expect-error PENDING TYPE GEN
    const { error } = await supabase.rpc("reap_upsert_anual_ano", {
      p_cpf: cpf,
      p_ano: String(ano),
      p_data: data,
    });

    if (error) throw error;
  },

  async batchMarkSent(
    entries: { cpf: string; tipo: "simplificado" | "anual"; anos: number[] }[]
  ): Promise<void> {
    for (const entry of entries) {
      for (const ano of entry.anos) {
        if (entry.tipo === "simplificado") {
          await this.upsertSimplificadoYear(entry.cpf, ano, {
            enviado: true,
            tem_problema: false,
          });
        } else {
          await this.upsertAnualYear(entry.cpf, ano, {
            enviado: true,
          });
        }
      }
    }
  },

  async importComprovantes(
    entries: { cpf: string; ano: number; dataEnvio: string }[]
  ): Promise<{ found: number; notFound: string[] }> {
    const notFound: string[] = [];
    let found = 0;

    for (const entry of entries) {
      // Verifica se o sócio existe
      const { data: socio } = await supabase
        .from("socios")
        .select("cpf")
        .eq("cpf", entry.cpf)
        .maybeSingle();

      if (!socio) {
        notFound.push(entry.cpf);
        continue;
      }

      // Busca o registro atual para não sobrescrever se já preenchido
      const { data } = await supabase
        // @ts-expect-error PENDING TYPE GEN
        .from("reap")
        .select("anual")
        .eq("cpf", entry.cpf)
        .maybeSingle();

      const reapRecord = data as unknown as { anual: unknown };
      const anualAtual = (reapRecord?.anual as Reap["anual"]) ?? {};
      const anoKey = String(entry.ano);

      // Ignora se já está como enviado com data
      if (anualAtual[anoKey]?.enviado && anualAtual[anoKey]?.data_envio) {
        found++;
        continue;
      }

      await this.upsertAnualYear(entry.cpf, entry.ano, {
        enviado: true,
        data_envio: entry.dataEnvio,
        tem_problema: false,
      });
      found++;
    }

    return { found, notFound };
  },

  async importPendencias(
    entries: { cpf: string; anosSimplificado: number[] }[]
  ): Promise<void> {
    const ANOS_SIMPLIFICADO = [2021, 2022, 2023, 2024];
    const batches = [];

    for (const entry of entries) {
      if (entry.anosSimplificado.length === 0) continue;

      const primeiroAnoPendente = Math.min(...entry.anosSimplificado);

      for (const ano of ANOS_SIMPLIFICADO) {
        if (ano < primeiroAnoPendente) continue;
        const isPendente = entry.anosSimplificado.includes(ano);
        
        batches.push(
          this.upsertSimplificadoYear(entry.cpf, ano, {
            enviado: !isPendente,
          })
        );
      }
    }

    // Dispara requests concorrentes controlados (Chuncking) de 25 em 25
    // Cada chamada executa 2 transações (upserts). Batch 25 mantem pico db_pool < 50
    const CHUNK_SIZE = 25;
    for (let i = 0; i < batches.length; i += CHUNK_SIZE) {
      await Promise.all(batches.slice(i, i + CHUNK_SIZE));
    }
  },

  async getReconciliationContext(): Promise<{
    entityUf: string;
    members: { cpf: string; nome: string | null; reap: Reap | null }[];
  }> {
    const { data: entity } = await supabase
      .from("entidade")
      .select("uf")
      .maybeSingle();

    const { data: members } = await supabase
      .from("socios")
      .select(`cpf, nome, reap ( simplificado, anual, updated_at )`);

    return {
      entityUf: entity?.uf ?? "PA",
      members: (members ?? []).map((m) => {
        const r = Array.isArray(m.reap) ? m.reap[0] : m.reap;
        return {
          cpf: m.cpf!,
          nome: m.nome,
          reap: r
            ? ({
                cpf: m.cpf!,
                simplificado: r.simplificado as Reap["simplificado"],
                anual: r.anual as Reap["anual"],
                updated_at: r.updated_at,
              } as Reap)
            : null,
        };
      }),
    };
  },

  normalizeName(name: string): string {
    return name
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  },
};
