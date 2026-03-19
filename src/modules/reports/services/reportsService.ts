import { supabase } from "@/shared/lib/supabase/client";
export interface RequestReportItem {
  id: string;
  cod_req_inss: number | string;
  nome: string;
  cpf: string;
  data_req: string;
  status?: string;
  tipo_requerimento?: string;
  emb_rgp?: string;
  rgp?: string;
  emissao_rgp?: string;
  protocolo?: string;
  socio_id?: string | number;
}
export interface RequestReportResponse {
  data: RequestReportItem[];
  total: number;
}
interface SocioData {
  id: number;
  cpf: string;
  emb_rgp: string | null;
  emissao_rgp: string | null;
}
const normalizeSociosData = (value: unknown): SocioData[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = Number(record.id);
      const cpf = typeof record.cpf === "string" ? record.cpf : "";
      if (!Number.isFinite(id) || !cpf) return null;
      return {
        id,
        cpf,
        emb_rgp: typeof record.emb_rgp === "string" ? record.emb_rgp : null,
        emissao_rgp:
          typeof record.emissao_rgp === "string" ? record.emissao_rgp : null,
      };
    })
    .filter((item): item is SocioData => item !== null);
};
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
      .select("*", { count: "exact" })
      .order("cod_req_inss", { ascending: false });
    if (searchTerm) {
      const isNumber = !isNaN(Number(searchTerm));
      if (isNumber) {
        query = query.or(
          `cod_req_inss.eq.${searchTerm},protocolo.eq.${searchTerm},cpf.ilike.%${searchTerm}%`,
        );
      } else {
        query = query.or(
          `nome.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`,
        );
      }
    }
    const {
      data: requerimentosData,
      count,
      error: reqError,
    } = await query.range(from, to);
    if (reqError) throw reqError;
    const cpfsSocios =
      requerimentosData
        ?.map((req) => req.cpf)
        .filter((cpf): cpf is string => !!cpf)
        .filter((value, index, self) => self.indexOf(value) === index) || [];
    let sociosData: SocioData[] = [];
    if (cpfsSocios.length > 0) {
      const { data: socios, error: sociosError } = await supabase
        .from("socios")
        .select("id, cpf, emb_rgp, emissao_rgp")
        .in("cpf", cpfsSocios);
      if (sociosError) {
        console.error("Error fetching member details:", sociosError);
        sociosData = [];
      } else {
        sociosData = normalizeSociosData(socios);
      }
    }
    const mergedData = (requerimentosData || []).map((req) => {
      const socio = sociosData.find((s) => s.cpf === req.cpf);
      const reqRecord = req as unknown as Record<string, unknown>;
      const item: RequestReportItem = {
        id: String(req.id),
        cod_req_inss: String(req.cod_req_inss || ""),
        nome: String(req.nome || ""),
        cpf: String(req.cpf || ""),
        data_req: String(reqRecord.data_req || req.data || ""),
        status: reqRecord.status ? String(reqRecord.status) : undefined,
        tipo_requerimento: reqRecord.tipo_requerimento
          ? String(reqRecord.tipo_requerimento)
          : undefined,
        emb_rgp: req.emb_rgp ? String(req.emb_rgp) : undefined,
        protocolo: reqRecord.protocolo ? String(reqRecord.protocolo) : undefined,
        rgp:
          socio?.emb_rgp || req.emb_rgp || reqRecord.rgp
            ? String(socio?.emb_rgp || req.emb_rgp || reqRecord.rgp)
            : undefined,
        emissao_rgp: socio?.emissao_rgp
          ? String(socio?.emissao_rgp)
          : undefined,
        socio_id: socio?.id ? socio.id : undefined,
      };
      return item;
    });
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
        .select("*", { count: "exact" })
        .order("cod_req_inss", { ascending: false })
        .range(from, to);
      if (searchTerm) {
        const isNumber = !isNaN(Number(searchTerm));
        if (isNumber) {
          query = query.or(
            `cod_req_inss.eq.${searchTerm},protocolo.eq.${searchTerm},cpf.ilike.%${searchTerm}%`,
          );
        } else {
          query = query.or(
            `nome.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`,
          );
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }
      const cpfsSocios = data
        .map((req) => req.cpf)
        .filter((cpf): cpf is string => !!cpf)
        .filter((value, index, self) => self.indexOf(value) === index);
      let sociosData: SocioData[] = [];
      if (cpfsSocios.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < cpfsSocios.length; i += batchSize) {
          const batch = cpfsSocios.slice(i, i + batchSize);
          const { data: socios, error: sociosError } = await supabase
            .from("socios")
            .select("id, cpf, emb_rgp, emissao_rgp")
            .in("cpf", batch);
          if (!sociosError && socios) {
            sociosData = [...sociosData, ...normalizeSociosData(socios)];
          }
        }
      }
      const mergedChunk = data.map((req) => {
        const socio = sociosData.find((s) => s.cpf === req.cpf);
        const reqRecord = req as unknown as Record<string, unknown>;
        const item: RequestReportItem = {
          id: String(req.id),
          cod_req_inss: String(req.cod_req_inss || ""),
          nome: String(req.nome || ""),
          cpf: String(req.cpf || ""),
          data_req: String(reqRecord.data_req || req.data || ""),
          status: reqRecord.status ? String(reqRecord.status) : undefined,
          tipo_requerimento: reqRecord.tipo_requerimento
            ? String(reqRecord.tipo_requerimento)
            : undefined,
          emb_rgp: req.emb_rgp ? String(req.emb_rgp) : undefined,
          protocolo: reqRecord.protocolo ? String(reqRecord.protocolo) : undefined,
          rgp:
            socio?.emb_rgp || req.emb_rgp || reqRecord.rgp
              ? String(socio?.emb_rgp || req.emb_rgp || reqRecord.rgp)
              : undefined,
          emissao_rgp: socio?.emissao_rgp
            ? String(socio?.emissao_rgp)
            : undefined,
          socio_id: socio?.id ? socio.id : undefined,
        };
        return item;
      });
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
