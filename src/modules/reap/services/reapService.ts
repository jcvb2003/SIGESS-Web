import { supabase } from "@/shared/lib/supabase/client";
import { fetchAll } from "@/shared/lib/supabase/utils";
import { normalizeName } from "@/shared/utils/text";
import { Json } from "@/shared/lib/supabase/database.types";
import { Reap, ReapAnoAnual, ReapAnoSimplificado, ReapWithMember } from "../types/reap.types";

type ReapRecordShape = Pick<Reap, "simplificado" | "anual" | "observacoes" | "updated_at">;

function firstReapRecord(value: unknown): ReapRecordShape | null {
  const record = Array.isArray(value) ? value[0] : value;
  return (record ?? null) as ReapRecordShape | null;
}

function hasProblems(
  simplificado: Reap["simplificado"],
  anual: Reap["anual"],
): boolean {
  return (
    Object.values(simplificado).some((v) => v.tem_problema) ||
    Object.values(anual).some((v) => v.tem_problema)
  );
}

interface ReapListViewRow {
  cpf: string;
  nome: string | null;
  nit: string | null;
  emissao_rgp: string | null;
  situacao: string | null;
  simplificado: Json;
  anual: Json;
  observacoes: string | null;
  updated_at: string;
  reap_status: "sem_reap" | "tem_problema" | "pendente" | "em_dia";
}

export const reapService = {
  async list(filters: {
    searchTerm?: string;
    page: number;
    pageSize: number;
    statusFilter?: string;
    unitId?: string | null;
  }): Promise<{ items: ReapWithMember[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;

    const query = supabase
      .from("reap_list_view" as unknown as "socios") // Hack para manter compatibilidade com PostgrestQueryBuilder sem 'any'
      .select("*", { count: "exact" });

    if (filters.unitId) {
      query.eq("unit_id", filters.unitId);
    }

    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query.or(`cpf.ilike.${term},nome.ilike.${term}`);
    }

    // Filtro de status usando a nova View
    if (filters.statusFilter && filters.statusFilter !== "todos") {
      if (filters.statusFilter === "pendente") {
        // Para "pendente", mostramos quem tem pendência real ou quem ainda não tem registro
        query.or("reap_status.eq.pendente,reap_status.eq.sem_reap");
      } else {
        query.eq("reap_status", filters.statusFilter);
      }
    }

    const { data, error, count } = await query
      .order("nome", { ascending: true })
      .range(from, to);

    if (error) throw error;

    const items: ReapWithMember[] = ((data as unknown as ReapListViewRow[]) || []).map((row) => {
      const simplificado = (row.simplificado as unknown as Reap["simplificado"]) ?? {};
      const anual = (row.anual as unknown as Reap["anual"]) ?? {};
      
      const tem_problema = hasProblems(simplificado, anual);

      return {
        cpf: row.cpf,
        member_nome: row.nome ?? null,
        member_nit: row.nit ?? null,
        emissao_rgp: row.emissao_rgp ?? null,
        simplificado,
        anual,
        observacoes: row.observacoes ?? null,
        updated_at: row.updated_at ?? "",
        tem_problema,
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
        nit,
        emissao_rgp,
        reap (
          simplificado,
          anual,
          observacoes,
          updated_at
        )
      `
      )
      .eq("cpf", cpf)
      .maybeSingle();

    if (error || !data) return null;

    const reapRecord = firstReapRecord(data.reap);
    const simplificado = (reapRecord?.simplificado as Reap["simplificado"]) ?? {};
    const anual = (reapRecord?.anual as Reap["anual"]) ?? {};

    const tem_problema = hasProblems(simplificado, anual);

    return {
      cpf: data.cpf!,
      member_nome: data.nome ?? null,
      member_nit: data.nit ?? null,
      emissao_rgp: data.emissao_rgp ?? null,
      simplificado,
      anual,
      observacoes: (reapRecord?.observacoes as string | null) ?? null,
      updated_at: reapRecord?.updated_at ?? "",
      tem_problema,
    };
  },

  async upsertSimplificadoYear(
    cpf: string,
    ano: number,
    data: Partial<ReapAnoSimplificado>
  ): Promise<void> {
    // Garante que o registro base existe
    await supabase

      .from("reap")
      .upsert({ cpf }, { onConflict: "cpf", ignoreDuplicates: true });

    // Atualiza apenas o ano específico no JSONB usando jsonb_set no banco

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

      .from("reap")
      .upsert({ cpf }, { onConflict: "cpf", ignoreDuplicates: true });


    const { error } = await supabase.rpc("reap_upsert_anual_ano", {
      p_cpf: cpf,
      p_ano: String(ano),
      p_data: data,
    });

    if (error) throw error;
  },

  async updateFullReap(
    cpf: string,
    simplificado: Reap["simplificado"],
    anual: Reap["anual"],
    observacoes: string | null
  ): Promise<void> {

    const { error } = await supabase.rpc("reap_upsert_full", {
      p_cpf: cpf,
      p_simplificado: simplificado as unknown as Json,
      p_anual: anual as unknown as Json,
      p_observacoes: observacoes ?? undefined,
    });

    if (error) throw error;
  },

  async updateObservacoes(cpf: string, observacoes: string | null): Promise<void> {
    const { error } = await supabase
      .from("reap")
      .upsert({ 
        cpf, 
        observacoes: observacoes ?? undefined 
      }, { onConflict: "cpf" });

    if (error) throw error;
  },

  async consolidateSimplificadoCompleteness(pendencyCpfs: string[], unitId?: string | null): Promise<number> {
    const pendencySet = new Set(pendencyCpfs);

    const baseQuery = supabase
      .from("socios")
      .select("cpf")
      .eq("situacao", "ATIVO");

    if (unitId) {
      baseQuery.eq("unit_id", unitId);
    }

    const allMembers = await fetchAll<{ cpf: string }>(baseQuery);

    const membersToMark = (allMembers || [])
      .map(m => m.cpf)
      .filter((cpf): cpf is string => !!cpf && !pendencySet.has(cpf));

    if (membersToMark.length === 0) return 0;

    // Prepara as entradas para o batch RPC
    const entries = membersToMark.map(cpf => ({
      cpf,
      simplificado: {
        "2021": { enviado: true, tem_problema: false, obs: null },
        "2022": { enviado: true, tem_problema: false, obs: null },
        "2023": { enviado: true, tem_problema: false, obs: null },
        "2024": { enviado: true, tem_problema: false, obs: null },
      }
    }));

    // Processa em chunks de 200 (seguro para o tamanho do payload JSON)
    const CHUNK_SIZE = 200;
    let totalUpdated = 0;

    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);

      const { error } = await supabase.rpc("reap_batch_upsert_simplificado_v2", {
        p_entries: chunk
      });

      if (error) throw error;
      totalUpdated += chunk.length;
    }

    return totalUpdated;
  },

  async batchMarkSent(
    entries: { cpf: string; tipo: "simplificado" | "anual"; anos: number[] }[]
  ): Promise<void> {
    const simplificadoRaw = entries.filter((e) => e.tipo === "simplificado");
    const anualRaw = entries.filter((e) => e.tipo === "anual");

    if (simplificadoRaw.length > 0) {
      await this.processBatchUpdate(
        simplificadoRaw, 
        "simplificado", 
        "reap_batch_upsert_simplificado_v2"
      );
    }

    if (anualRaw.length > 0) {
      await this.processBatchUpdate(
        anualRaw, 
        "anual", 
        "reap_batch_upsert_anual_v2"
      );
    }
  },

  async processBatchUpdate(
    rawEntries: { cpf: string; anos: number[] }[],
    field: "simplificado" | "anual",
    rpcName: string
  ): Promise<void> {
    const CHUNK_SIZE = 50;
    const CONCURRENCY = 15;
    
    const batchData = rawEntries.map((e) => ({
      cpf: e.cpf,
      [field]: e.anos.reduce(
        (acc, ano) => ({
          ...acc,
          [String(ano)]: { enviado: true, tem_problema: false },
        }),
        {}
      ),
    }));

    for (let i = 0; i < batchData.length; i += CHUNK_SIZE * CONCURRENCY) {
      const promises = [];
      for (let j = 0; j < CONCURRENCY; j++) {
        const start = i + j * CHUNK_SIZE;
        if (start >= batchData.length) break;
        promises.push(
          supabase.rpc(rpcName as any, {
            p_entries: batchData.slice(start, start + CHUNK_SIZE),
          })
        );
      }
      const results = await Promise.all(promises);
      for (const res of results) if (res.error) throw res.error;
    }
  },

  async importComprovantes(
    entries: { cpf: string; ano: number; dataEnvio: string }[]
  ): Promise<{ found: number; notFound: string[] }> {
    // Pré-carrega CPFs conhecidos e registros REAP existentes em 2 queries totais
    // Elimina N+1 queries sequenciais (era 3 queries por arquivo × 414 = 1.242 requests)
    const fetchSocios = () => fetchAll<{ cpf: string }>(supabase.from("socios").select("cpf"));
    const fetchReaps = () => fetchAll<{ cpf: string; anual: Record<string, any> }>(supabase.from("reap").select("cpf, anual"));

    const [socios, reapRecords] = await Promise.all([
      fetchSocios(),
      fetchReaps(),
    ]);

    const cpfSet = new Set((socios ?? []).map((s) => s.cpf));
    const reapMap = new Map<string, Reap["anual"]>(
      (reapRecords ?? []).map((r) => [r.cpf, (r.anual as Reap["anual"]) ?? {}])
    );

    const notFound: string[] = [];
    let found = 0;
    const paraProcessar: { cpf: string; ano: number; dataEnvio: string }[] = [];

    for (const entry of entries) {
      if (!cpfSet.has(entry.cpf)) {
        notFound.push(entry.cpf);
        continue;
      }

      const anualAtual = reapMap.get(entry.cpf) ?? {};
      const anoKey = String(entry.ano);
      if (anualAtual[anoKey]?.enviado && anualAtual[anoKey]?.data_envio) {
        found++;
        continue;
      }

      paraProcessar.push(entry);
    }

    const batchDataMap = this.groupAnualEntriesByCpf(paraProcessar);
    const batchEntries = Array.from(batchDataMap.values());
    const CHUNK_SIZE = 50;
    const CONCURRENCY = 15;

    for (let i = 0; i < batchEntries.length; i += CHUNK_SIZE * CONCURRENCY) {
      const promises = [];
      const currentChunks: { cpf: string; anual: Record<string, Partial<ReapAnoAnual>> }[][] = [];

      for (let j = 0; j < CONCURRENCY; j++) {
        const start = i + j * CHUNK_SIZE;
        if (start >= batchEntries.length) break;
        const chunk = batchEntries.slice(start, start + CHUNK_SIZE);
        currentChunks.push(chunk);
        promises.push(
          supabase.rpc("reap_batch_upsert_anual_v2", {
            p_entries: chunk,
          })
        );
      }

      const results = await Promise.all(promises);
      for (const res of results) if (res.error) throw res.error;

      for (const chunk of currentChunks) {
        for (const item of chunk) {
          found += Object.keys(item.anual).length;
        }
      }
    }

    return { found, notFound };
  },

  groupAnualEntriesByCpf(entries: { cpf: string; ano: number; dataEnvio: string }[]) {
    const map = new Map<string, { cpf: string; anual: Record<string, Partial<ReapAnoAnual>> }>();
    for (const entry of entries) {
      if (!map.has(entry.cpf)) {
        map.set(entry.cpf, { cpf: entry.cpf, anual: {} });
      }
      const batchEntry = map.get(entry.cpf)!;
      batchEntry.anual[String(entry.ano)] = {
        enviado: true,
        data_envio: entry.dataEnvio,
        tem_problema: false,
      };
    }
    return map;
  },

  async importPendencias(
    entries: { cpf: string; anosSimplificado: number[] }[]
  ): Promise<void> {
    const ANOS_SIMPLIFICADO = [2021, 2022, 2023, 2024];

    // Agrupa por CPF para enviar tudo em uma chamada por sócio
    const batchData = entries
      .map((entry) => {
        const simplificado: Record<string, Partial<ReapAnoSimplificado>> = {};
        const anosNumericos = entry.anosSimplificado.map(Number);
        const primeiroAnoPendente =
          anosNumericos.length > 0 ? Math.min(...anosNumericos) : 9999;

        for (const ano of ANOS_SIMPLIFICADO) {
          if (ano < primeiroAnoPendente) continue;
          simplificado[String(ano)] = {
            enviado: !anosNumericos.includes(ano),
          };
        }
        return { cpf: entry.cpf, simplificado };
      })
      .filter((e) => Object.keys(e.simplificado).length > 0);

    const CHUNK_SIZE = 50;
    const CONCURRENCY = 15;
    for (let i = 0; i < batchData.length; i += CHUNK_SIZE * CONCURRENCY) {
      const promises = [];
      for (let j = 0; j < CONCURRENCY; j++) {
        const start = i + j * CHUNK_SIZE;
        if (start >= batchData.length) break;
        promises.push(
          supabase.rpc("reap_batch_upsert_simplificado_v2", {
            p_entries: batchData.slice(start, start + CHUNK_SIZE),
          })
        );
      }
      const results = await Promise.all(promises);
      for (const res of results) if (res.error) throw res.error;
    }
  },

  async getReconciliationContext(unitId?: string | null): Promise<{
    entityUf: string;
    members: { cpf: string; nome: string | null; reap: Reap | null }[];
  }> {
    const entidadeQuery = supabase.from("entidade").select("uf").limit(1);
    if (unitId) entidadeQuery.eq("unit_id", unitId);
    const { data: entity } = await entidadeQuery.maybeSingle();

    interface MemberWithReap {
      cpf: string;
      nome: string | null;
      reap: Array<{
        simplificado: Record<string, any>;
        anual: Record<string, any>;
        updated_at: string;
        observacoes: string | null;
      }> | {
        simplificado: Record<string, any>;
        anual: Record<string, any>;
        updated_at: string;
        observacoes: string | null;
      } | null;
    }

    const baseQuery = supabase
      .from("socios")
      .select(`cpf, nome, reap ( simplificado, anual, updated_at, observacoes )`);

    if (unitId) {
      baseQuery.eq("unit_id", unitId);
    }

    const allMembers = await fetchAll<MemberWithReap>(baseQuery);
    
    const members = (allMembers || []).filter((m): m is MemberWithReap => !!m.cpf);
    
    return {
      entityUf: entity?.uf ?? "PA",
      members: members.map((m) => {
        const r = Array.isArray(m.reap) ? m.reap[0] : m.reap;
        return {
          cpf: m.cpf,
          nome: m.nome,
          reap: r
            ? {
                cpf: m.cpf,
                simplificado: r.simplificado ?? {},
                anual: r.anual ?? {},
                updated_at: r.updated_at,
                observacoes: r.observacoes ?? null,
                tem_problema: hasProblems(
                  (r.simplificado ?? {}) as Reap["simplificado"],
                  (r.anual ?? {}) as Reap["anual"],
                ),
              }
            : null,
        };
      }),
    };
  },

  normalizeName(name: string): string {
    return normalizeName(name);
  },
};
