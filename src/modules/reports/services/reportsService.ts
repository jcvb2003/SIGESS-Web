import { supabase } from "@/shared/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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

function mapRequerimentoToItem(req: { id?: string | number, cod_req?: string | number | null, cpf?: string | null, data_assinatura?: string | null, socios?: unknown }): RequestReportItem {
  const socioObj = req.socios as { id?: string; nome?: string; num_rgp?: string; emissao_rgp?: string } | null;
  return {
    id: String(req.id),
    cod_req: String(req.cod_req || ""),
    nome: String(socioObj?.nome || ""),
    cpf: String(req.cpf || ""),
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
      .select("id, cod_req, data_assinatura, cpf, socios!inner(id, nome, num_rgp, emissao_rgp)", { count: "exact" })
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
        .select("id, cod_req, data_assinatura, cpf, socios!inner(id, nome, num_rgp, emissao_rgp)", { count: "exact" })
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
    ]);

    autoTable(doc, {
      head: [["Data", "Nome", "CPF", "RGP"]],
      body: tableData,
      startY: 30,
    });

    doc.save(
      `relatorio_requerimentos_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  },
};
