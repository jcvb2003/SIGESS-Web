import { supabase } from "@/shared/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
export interface RequestReportItem {
  id: string;
  cod_req: number | string;
  nome: string;
  cpf: string;
  nit?: string;
  data_req: string;
  status?: string;
  tipo_requerimento?: string;
  num_rgp?: string;
  rgp?: string;
  emissao_rgp?: string;
  protocolo?: string;
  socio_id?: string;
}

function mapRequerimentoToItem(req: { id?: string | number, cod_req?: string | number | null, cpf?: string | null, data_assinatura?: string | null, socios?: unknown }): RequestReportItem {
  const socioObj = req.socios as { id?: string; nome?: string; num_rgp?: string; emissao_rgp?: string; nit?: string } | null;
  return {
    id: String(req.id),
    cod_req: String(req.cod_req || ""),
    nome: String(socioObj?.nome || ""),
    cpf: String(req.cpf || ""),
    nit: socioObj?.nit ? String(socioObj.nit) : undefined,
    data_req: String(req.data_assinatura || ""),
    rgp: socioObj?.num_rgp ? String(socioObj.num_rgp) : undefined,
    emissao_rgp: socioObj?.emissao_rgp ? String(socioObj.emissao_rgp) : undefined,
    socio_id: socioObj?.id ? String(socioObj.id) : undefined,
  };
}

export interface RequestReportResponse {
  data: RequestReportItem[];
  total: number;
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
      .select("id, cod_req, data_assinatura, cpf, socios!inner(id, nome, num_rgp, emissao_rgp, nit)", { count: "exact" })
      .order("cod_req", { ascending: false });

    if (searchTerm) {
      const like = `%${searchTerm}%`;
      query = query.or(`cod_req.ilike.${like},cpf.ilike.${like},socios.nome.ilike.${like}`);
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

  async fetchNaoAssinadosReport(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = "",
    carenciaFilter: string = "all",
  ): Promise<RequestReportResponse> {
    const { data, error } = await (supabase as any).rpc(
      "list_requirements_extended",
      {
        p_ano: new Date().getFullYear(),
        p_search: searchTerm,
        p_status: "nao_assinado",
        p_carencia: carenciaFilter,
        p_page: page,
        p_page_size: pageSize,
      },
      { count: "exact" }
    );

    if (error) throw error;

    const mappedData: RequestReportItem[] = ((data as any[]) || []).map((item: any) => ({
      id: item.socio_id, 
      cod_req: item.cod_req || "---",
      nome: item.socio_nome,
      cpf: item.cpf,
      nit: item.socio_nit,
      data_req: item.data_assinatura || "",
      rgp: item.socio_num_rgp || item.socio_nit,
      emissao_rgp: item.socio_emissao_rgp,
      socio_id: item.socio_id,
    }));

    return {
      data: mappedData,
      total: Number((data as any[])?.[0]?.total_count || 0),
    };
  },

  async fetchAllRequestsReport(
    searchTerm: string = "",
    reportType: string = "requerimentos",
    carenciaFilter: string = "all"
  ): Promise<RequestReportItem[]> {
    if (reportType === "nao_assinados") {
      const { data, error } = await (supabase as any).rpc(
        "list_requirements_extended",
        {
          p_ano: new Date().getFullYear(),
          p_search: searchTerm,
          p_status: "nao_assinado",
          p_carencia: carenciaFilter,
          p_page: 1,
          p_page_size: 5000,
        }
      );
      if (error) throw error;
      return ((data as any[]) || []).map((item: any) => ({
        id: item.socio_id,
        cod_req: item.cod_req || "---",
        nome: item.socio_nome,
        cpf: item.cpf,
        nit: item.socio_nit,
        data_req: item.data_assinatura || "",
        rgp: item.socio_num_rgp || item.socio_nit,
        emissao_rgp: item.socio_emissao_rgp,
        socio_id: item.socio_id,
      }));
    }

    let allData: RequestReportItem[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("requerimentos")
        .select("id, cod_req, data_assinatura, cpf, socios!inner(id, nome, num_rgp, emissao_rgp, nit)", { count: "exact" })
        .order("cod_req", { ascending: false })
        .range(from, to);

      if (searchTerm) {
        const like = `%${searchTerm}%`;
        query = query.or(`cod_req.ilike.${like},cpf.ilike.${like},socios.nome.ilike.${like}`);
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

  async exportToExcel(data: RequestReportItem[]): Promise<void> {
    const excelData = data.map((item) => ({
      Data: item.data_req ? new Date(item.data_req).toLocaleDateString() : "",
      Nome: item.nome,
      CPF: item.cpf,
      RGP: item.rgp || item.num_rgp || "",
      "Data RGP": item.emissao_rgp ? new Date(item.emissao_rgp).toLocaleDateString() : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requerimentos");

    XLSX.writeFile(
      workbook,
      `relatorio_requerimentos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  },

  async exportToPdf(data: RequestReportItem[]): Promise<void> {
    const doc = new jsPDF();
    doc.text("Relatório de Assinaturas", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = data.map((item) => [
      item.data_req ? new Date(item.data_req).toLocaleDateString() : "",
      item.nome,
      item.cpf,
      item.rgp || item.num_rgp || "",
      item.emissao_rgp ? new Date(item.emissao_rgp).toLocaleDateString() : "",
    ]);

    autoTable(doc, {
      head: [["Data", "Nome", "CPF", "RGP", "Data RGP"]],
      body: tableData,
      startY: 30,
    });

    doc.save(
      `relatorio_requerimentos_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  },
};
