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
          observacoes,
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
        observacoes: (reapRecord?.observacoes as string | null) ?? null,
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
          observacoes,
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
      observacoes: (reapRecord?.observacoes as string | null) ?? null,
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
      // p_simplificado e p_anual usam 'as any' pois o schema JSONB é dinâmico e processado no banco via RPC
      p_simplificado: simplificado as any,
      p_anual: anual as any,
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

  async consolidateSimplificadoCompleteness(pendencyCpfs: string[]): Promise<number> {
    const pendencySet = new Set(pendencyCpfs);

    // Busca todos os CPFs de sócios ativos
    const { data: allMembers, error: fetchError } = await supabase
      .from("socios")
      .select("cpf")
      .eq("situacao", "ATIVO");

    if (fetchError) throw fetchError;

    const membersToMark = (allMembers || [])
      .map(m => m.cpf)
      .filter(cpf => !!cpf && !pendencySet.has(cpf));

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

    const CHUNK_SIZE = 50;

    if (simplificadoRaw.length > 0) {
      const batchData = simplificadoRaw.map((e) => ({
        cpf: e.cpf,
        simplificado: e.anos.reduce(
          (acc, ano) => ({
            ...acc,
            [String(ano)]: { enviado: true, tem_problema: false },
          }),
          {}
        ),
      }));

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
    }

    if (anualRaw.length > 0) {
      const batchData = anualRaw.map((e) => ({
        cpf: e.cpf,
        anual: e.anos.reduce(
          (acc, ano) => ({
            ...acc,
            [String(ano)]: { enviado: true, tem_problema: false },
          }),
          {}
        ),
      }));

      const CONCURRENCY = 15;
      for (let i = 0; i < batchData.length; i += CHUNK_SIZE * CONCURRENCY) {
        const promises = [];
        for (let j = 0; j < CONCURRENCY; j++) {
          const start = i + j * CHUNK_SIZE;
          if (start >= batchData.length) break;
          promises.push(
            supabase.rpc("reap_batch_upsert_anual_v2", {
              p_entries: batchData.slice(start, start + CHUNK_SIZE),
            })
          );
        }
        const results = await Promise.all(promises);
        for (const res of results) if (res.error) throw res.error;
      }
    }
  },

  async importComprovantes(
    entries: { cpf: string; ano: number; dataEnvio: string }[]
  ): Promise<{ found: number; notFound: string[] }> {
    // Pré-carrega CPFs conhecidos e registros REAP existentes em 2 queries totais
    // Elimina N+1 queries sequenciais (era 3 queries por arquivo × 414 = 1.242 requests)
    // Paginação para superar o PostgREST max_rows
    const fetchSocios = async () => {
      let all: { cpf: string | null }[] = [];
      let from = 0;
      while (true) {
        const { data } = await supabase.from("socios").select("cpf").range(from, from + 1000 - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < 1000) break;
        from += 1000;
      }
      return all;
    };
    
    const fetchReaps = async () => {
      let all: { cpf: string; anual: unknown }[] = [];
      let from = 0;
      while (true) {

        const { data } = await supabase.from("reap").select("cpf, anual").range(from, from + 1000 - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data as unknown as { cpf: string; anual: unknown }[]);
        if (data.length < 1000) break;
        from += 1000;
      }
      return all;
    };

    const [socios, reapRecords] = await Promise.all([
      fetchSocios(),
      fetchReaps(),
    ]);

    const cpfSet = new Set((socios ?? []).map((s) => s.cpf));
    const reapMap = new Map(
      (reapRecords ?? []).map((r) => {
        const rec = r as unknown as { cpf: string; anual: Reap["anual"] };
        return [rec.cpf, rec.anual ?? {}];
      })
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

    // Agrupa por CPF para usar a RPC de lote
    const batchDataMap = new Map<string, any>();
    for (const entry of paraProcessar) {
      if (!batchDataMap.has(entry.cpf)) {
        batchDataMap.set(entry.cpf, { cpf: entry.cpf, anual: {} });
      }
      batchDataMap.get(entry.cpf).anual[String(entry.ano)] = {
        enviado: true,
        data_envio: entry.dataEnvio,
        tem_problema: false,
      };
    }

    const batchEntries = Array.from(batchDataMap.values());
    const CHUNK_SIZE = 50;
    const CONCURRENCY = 15;

    for (let i = 0; i < batchEntries.length; i += CHUNK_SIZE * CONCURRENCY) {
      const promises = [];
      const currentChunks: any[][] = [];

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

      // Conta quantos registros foram processados nestes chunks
      for (const chunk of currentChunks) {
        for (const item of chunk) {
          found += Object.keys(item.anual).length;
        }
      }
    }

    return { found, notFound };
  },

  async importPendencias(
    entries: { cpf: string; anosSimplificado: number[] }[]
  ): Promise<void> {
    const ANOS_SIMPLIFICADO = [2021, 2022, 2023, 2024];

    // Agrupa por CPF para enviar tudo em uma chamada por sócio
    const batchData = entries
      .map((entry) => {
        const simplificado: any = {};
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

  async getReconciliationContext(): Promise<{
    entityUf: string;
    members: { cpf: string; nome: string | null; reap: Reap | null }[];
  }> {
    const { data: entity } = await supabase
      .from("entidade")
      .select("uf")
      .maybeSingle();

    let allMembers: { cpf: string | null; nome: string | null; reap: unknown }[] = [];
    let fromIndex = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("socios")
        .select(`cpf, nome, reap ( simplificado, anual, updated_at )`)
        .range(fromIndex, fromIndex + pageSize - 1);

      if (error) break;
      if (!data || data.length === 0) break;

      allMembers = allMembers.concat(data);
      if (data.length < pageSize) break;
      fromIndex += pageSize;
    }
    
    const members = allMembers.filter((m): m is typeof m & { cpf: string } => !!m.cpf);
    
    return {
      entityUf: entity?.uf ?? "PA",
      members: members.map((m) => {
        const r = Array.isArray(m.reap) ? m.reap[0] : m.reap;
        return {
          cpf: m.cpf,
          nome: m.nome,
          reap: r
            ? ({
                cpf: m.cpf,
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
