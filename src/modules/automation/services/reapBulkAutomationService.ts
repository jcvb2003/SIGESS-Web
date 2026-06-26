import { supabase } from "@/shared/lib/supabase/client";
import { ANOS_SIMPLIFICADO, ANO_INICIAL_ANUAL, ANO_ATUAL } from "@/modules/reap/types/reap.types";
import { getApplicableYears } from "@/modules/reap/domain/reapDomain";

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
  tenantId?: string | null,
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
            args: { p_entries: unknown[]; p_tenant_id?: string | null },
          ) => Promise<{ error: Error | null }>
        )(rpcName, {
          p_entries: batchData.slice(start, start + chunkSize),
          p_tenant_id: tenantId ?? null,
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
    const anosSimplificadoPendentes = getApplicableYears(member.emissao_rgp, "simplificado")
      .filter((ano) => !simplificadoRegistrado[String(ano)]?.enviado);

    const anosAnualPendentes: number[] = [];
    for (const ano of getApplicableYears(member.emissao_rgp, "anual")) {
      if (!anualRegistrado[String(ano)]?.enviado) {
        anosAnualPendentes.push(ano);
      }
    }

    return { anosSimplificadoPendentes, anosAnualPendentes };
  },

  async batchMarkSent(entries: BatchEntry[], tenantId?: string | null): Promise<void> {
    const simplificadoEntries = entries.filter((entry) => entry.tipo === "simplificado");
    const anualEntries = entries.filter((entry) => entry.tipo === "anual");

    if (simplificadoEntries.length > 0) {
      await processBatchUpdate(
        simplificadoEntries,
        "simplificado",
        "reap_batch_upsert_simplificado_v2",
        tenantId,
      );
    }

    if (anualEntries.length > 0) {
      await processBatchUpdate(
        anualEntries,
        "anual",
        "reap_batch_upsert_anual_v2",
        tenantId,
      );
    }
  },
};

export const govBatchAutomationService = reapBulkAutomationService;
export type BulkAutomationSearchResult = GovBatchSearchResult;
