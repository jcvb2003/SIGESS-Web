import { supabase } from "@/shared/lib/supabase/client";

const ANOS_SIMPLIFICADO = [2021, 2022, 2023, 2024] as const;
const ANO_INICIAL_ANUAL = 2025;
const ANO_ATUAL = new Date().getFullYear();

type BatchEntry = {
  cpf: string;
  tipo: "simplificado" | "anual";
  anos: number[];
};

export type GovBatchSearchResult = {
  cpf: string | null;
  nome: string | null;
  senhagov_inss?: string | null;
  emissao_rgp: string | null;
  reap:
    | Array<{
        simplificado?: Record<string, { enviado?: boolean }>;
        anual?: Record<string, { enviado?: boolean }>;
      }>
    | {
        simplificado?: Record<string, { enviado?: boolean }>;
        anual?: Record<string, { enviado?: boolean }>;
      }
    | null;
};

async function processBatchUpdate(
  rawEntries: { cpf: string; anos: number[] }[],
  field: "simplificado" | "anual",
  rpcName: string,
): Promise<void> {
  const chunkSize = 50;
  const concurrency = 15;

  const batchData = rawEntries.map((entry) => ({
    cpf: entry.cpf,
    [field]: entry.anos.reduce(
      (acc, ano) => ({
        ...acc,
        [String(ano)]: { enviado: true, tem_problema: false },
      }),
      {},
    ),
  }));

  for (let i = 0; i < batchData.length; i += chunkSize * concurrency) {
    const promises = [];

    for (let j = 0; j < concurrency; j++) {
      const start = i + j * chunkSize;
      if (start >= batchData.length) break;

      promises.push(
        (
          supabase.rpc as unknown as (
            fn: string,
            args: { p_entries: unknown[] },
          ) => Promise<{ error: Error | null }>
        )(rpcName, {
          p_entries: batchData.slice(start, start + chunkSize),
        }),
      );
    }

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result.error) throw result.error;
    }
  }
}

export const reapBulkAutomationService = {
  anosSimplificado: [...ANOS_SIMPLIFICADO],
  anoInicialAnual: ANO_INICIAL_ANUAL,
  anoAtual: ANO_ATUAL,

  async searchMembers(search: string): Promise<GovBatchSearchResult[]> {
    if (search.length < 2) return [];

    const { data, error } = await supabase
      .from("socios")
      .select("cpf, nome, senhagov_inss, emissao_rgp, reap ( simplificado, anual )")
      .or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`)
      .limit(10);

    if (error) throw error;
    return (data ?? []) as GovBatchSearchResult[];
  },

  getPendingYears(member: GovBatchSearchResult) {
    const reap = Array.isArray(member.reap) ? member.reap[0] : member.reap;
    const simplificadoRegistrado = reap?.simplificado ?? {};
    const anualRegistrado = reap?.anual ?? {};
    const anoRgp = member.emissao_rgp
      ? new Date(member.emissao_rgp).getFullYear()
      : null;

    const anosSimplificadoPendentes = ANOS_SIMPLIFICADO.filter((ano) => {
      if (anoRgp && ano < anoRgp) return false;
      return !simplificadoRegistrado[String(ano)]?.enviado;
    });

    const anosAnualPendentes: number[] = [];
    const anoInicioAnual = anoRgp
      ? Math.max(anoRgp, ANO_INICIAL_ANUAL)
      : ANO_INICIAL_ANUAL;

    for (let ano = anoInicioAnual; ano <= ANO_ATUAL - 1; ano++) {
      if (!anualRegistrado[String(ano)]?.enviado) {
        anosAnualPendentes.push(ano);
      }
    }

    return { anosSimplificadoPendentes, anosAnualPendentes };
  },

  async batchMarkSent(entries: BatchEntry[]): Promise<void> {
    const simplificadoEntries = entries.filter((entry) => entry.tipo === "simplificado");
    const anualEntries = entries.filter((entry) => entry.tipo === "anual");

    if (simplificadoEntries.length > 0) {
      await processBatchUpdate(
        simplificadoEntries,
        "simplificado",
        "reap_batch_upsert_simplificado_v2",
      );
    }

    if (anualEntries.length > 0) {
      await processBatchUpdate(
        anualEntries,
        "anual",
        "reap_batch_upsert_anual_v2",
      );
    }
  },
};

export const govBatchAutomationService = reapBulkAutomationService;
export type BulkAutomationSearchResult = GovBatchSearchResult;
