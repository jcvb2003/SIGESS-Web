import { supabase } from "@/shared/lib/supabase/client";
export interface RequestReportItem {
  id: string;
  cod_req: number | string;
  nome: string;
  cpf: string;
  data_req: string;
  status?: string;
  tipo_requerimento?: string;
  num_rgp?: string;
  rgp?: string;
  emissao_rgp?: string;
  protocolo?: string;
  socio_id?: string;
}

function mapRequerimentoToItem(req: { id?: string | number, cod_req?: string | number, cpf?: string | null, data?: string | null, socios?: unknown }): RequestReportItem {
  const socioObj = req.socios as { id?: string; nome?: string; num_rgp?: string; emissao_rgp?: string } | null;
  return {
    id: String(req.id),
    cod_req: String(req.cod_req || ""),
    nome: String(socioObj?.nome || ""),
    cpf: String(req.cpf || ""),
    data_req: String(req.data || ""),
    rgp: socioObj?.num_rgp ? String(socioObj.num_rgp) : undefined,
    emissao_rgp: socioObj?.emissao_rgp ? String(socioObj.emissao_rgp) : undefined,
    socio_id: socioObj?.id ? String(socioObj.id) : undefined,
  };
}

export interface RequestReportResponse {
  data: RequestReportItem[];
  total: number;
}

async function buildSearchFilters(searchTerm: string): Promise<string> {
  const isNumber = !Number.isNaN(Number(searchTerm));
  const like = `%${searchTerm}%`;
  // Buscar cpfs baseados no nome do socio
  const { data: matchedSocios } = await supabase.from("socios").select("cpf").or(`nome.ilike.${like}`).limit(100);
  const cpfsInQuery = matchedSocios?.length ? matchedSocios.map((s: { cpf: string }) => '"' + s.cpf + '"').join(',') : '';

  let orString = '';
  if (isNumber) orString += `cod_req.eq.${searchTerm},`;
  orString += `cpf.ilike.${like}`;
  if (cpfsInQuery) orString += `,cpf.in.(${cpfsInQuery})`;

  return orString;
}

export const reportsService = {
  async fetchRequestsReport(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = "",
  ): Promise<RequestReportResponse> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("requerimentos")
      .select("id, cod_req, data, cpf, socios!inner(id, nome, num_rgp, emissao_rgp)", { count: "exact" })
      .order("cod_req", { ascending: false });

    if (searchTerm) {
      query = query.or(await buildSearchFilters(searchTerm));
    }

    const {
      data: requerimentosData,
      count,
      error: reqError,
    } = await query.range(from, to);

    if (reqError) throw reqError;

    const mergedData = (requerimentosData || []).map((req) => mapRequerimentoToItem(req));
    return {
      data: mergedData,
      total: count || 0,
    };
  },
  async fetchAllRequestsReport(
    searchTerm: string = "",
  ): Promise<RequestReportItem[]> {
    let allData: RequestReportItem[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("requerimentos")
        .select("id, cod_req, data, cpf, socios!inner(id, nome, num_rgp, emissao_rgp)", { count: "exact" })
        .order("cod_req", { ascending: false })
        .range(from, to);

      if (searchTerm) {
        query = query.or(await buildSearchFilters(searchTerm));
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        break;
      }

      const mergedChunk = data.map((req) => mapRequerimentoToItem(req));
      allData = [...allData, ...mergedChunk];
      if (data.length < pageSize) {
        hasMore = false;
      }
      page++;
    }
    return allData;
  },
  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase.from("requerimentos").delete().eq("id", id);
    if (error) throw error;
  },
};
