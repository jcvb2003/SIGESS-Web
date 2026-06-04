import { supabase } from "@/shared/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type {
  ExtendedRequirementRow,
  RequirementsRpcClient,
} from "@/modules/requirements/types/requirement.types";
import { getFishingRegistryDisplay } from "@/modules/members/utils/fisherIdentity";
import {
  getPaymentCompetenciaLabel,
  getPaymentTypeLabel,
} from "@/modules/finance/utils/paymentReportLabels";
import { formatDate } from "@/shared/utils/date";
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

const requirementsRpc = supabase as unknown as RequirementsRpcClient;

function mapExtendedRequirementToItem(item: ExtendedRequirementRow): RequestReportItem {
  return {
    id: item.socio_id ?? item.id ?? "",
    cod_req: item.cod_req || "---",
    nome: item.socio_nome ?? "",
    cpf: item.cpf ?? "",
    nit: item.socio_nit ?? undefined,
    data_req: item.data_assinatura || "",
    rgp: getFishingRegistryDisplay(item),
    emissao_rgp: item.socio_emissao_rgp ?? undefined,
    socio_id: item.socio_id ?? item.id,
  };
}


export const reportsService = {
  async fetchRequestsReport(
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = "",
    unitId?: string | null,
  ): Promise<RequestReportResponse> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("requerimentos")
      .select("id, cod_req, data_assinatura, cpf, socios!inner(id, nome, num_rgp, emissao_rgp, nit)", { count: "exact" })
      .order("cod_req", { ascending: false });

    if (unitId) {
      query = query.eq("socios.unit_id" as never, unitId);
    }

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
    unitId?: string | null,
  ): Promise<RequestReportResponse> {
    const { data, error } = await requirementsRpc.rpc(
      "list_requirements_extended",
      {
        p_ano: new Date().getFullYear(),
        p_search: searchTerm,
        p_status: "nao_assinado",
        p_beneficio: "all",
        p_carencia: carenciaFilter,
        p_page: page,
        p_page_size: pageSize,
        p_unit_id: unitId ?? null,
      },
      { count: "exact" }
    );

    if (error) throw error;

    const rows = data ?? [];
    const mappedData = rows.map(mapExtendedRequirementToItem);

    return {
      data: mappedData,
      total: Number(rows[0]?.total_count || 0),
    };
  },

  async fetchAllRequestsReport(
    searchTerm: string = "",
    reportType: string = "requerimentos",
    carenciaFilter: string = "all",
    unitId?: string | null,
  ): Promise<RequestReportItem[]> {
    if (reportType === "nao_assinados") {
      const { data, error } = await requirementsRpc.rpc(
        "list_requirements_extended",
        {
          p_ano: new Date().getFullYear(),
          p_search: searchTerm,
          p_status: "nao_assinado",
          p_beneficio: "all",
          p_carencia: carenciaFilter,
          p_page: 1,
          p_page_size: 5000,
          p_unit_id: unitId ?? null,
        }
      );
      if (error) throw error;
      return (data ?? []).map(mapExtendedRequirementToItem);
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

      if (unitId) {
        query = query.eq("socios.unit_id" as never, unitId);
      }

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
      Data: formatDate(item.data_req),
      Nome: item.nome,
      CPF: item.cpf,
      RGP: getFishingRegistryDisplay(item) ?? "",
      "Data RGP": formatDate(item.emissao_rgp),
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
      formatDate(item.data_req),
      item.nome,
      item.cpf,
      getFishingRegistryDisplay(item) ?? "",
      formatDate(item.emissao_rgp),
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

  async exportPaymentsToExcel(data: any[]): Promise<void> {
    const excelData = data.map((item) => ({
      "Data Pag.": formatDate(item.data_pagamento),
      Nome: item.nome,
      CPF: item.cpf,
      Tipo: getPaymentTypeLabel(item),
      "Competência": getPaymentCompetenciaLabel(item),
      Forma: item.forma_pagamento,
      Valor: item.valor,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagamentos");

    XLSX.writeFile(
      workbook,
      `relatorio_pagamentos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  },

  async exportPaymentsToPdf(data: any[]): Promise<void> {
    const doc = new jsPDF();
    doc.text("Relatório de Pagamentos por Período", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = data.map((item) => [
      formatDate(item.data_pagamento),
      item.nome,
      item.cpf,
      getPaymentTypeLabel(item),
      getPaymentCompetenciaLabel(item),
      item.forma_pagamento,
      item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    ]);

    autoTable(doc, {
      head: [["Data Pag.", "Nome", "CPF", "Tipo", "Competência", "Forma", "Valor"]],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Emerald-600
    });

    doc.save(
      `relatorio_pagamentos_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  },

  async exportDAEsToExcel(data: any[]): Promise<void> {
    const excelData = data.map((item) => ({
      "Data Rec.": formatDate(item.data_recebimento),
      "Data Boleto": formatDate(item.data_pagamento_boleto),
      Nome: item.nome,
      CPF: item.cpf,
      Tipo: item.tipo_boleto,
      "Competência": item.competencia_mes ? `${String(item.competencia_mes).padStart(2, "0")}/${item.competencia_ano}` : item.competencia_ano,
      Forma: item.forma_pagamento,
      "Boleto Pago": item.boleto_pago ? "Sim" : "Não",
      Valor: item.valor,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DAEs");

    XLSX.writeFile(
      workbook,
      `relatorio_daes_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  },

  async exportDAEsToPdf(data: any[]): Promise<void> {
    const doc = new jsPDF();
    doc.text("Relatório de DAEs por Período", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableData = data.map((item) => [
      formatDate(item.data_recebimento),
      formatDate(item.data_pagamento_boleto),
      item.nome,
      item.cpf,
      item.tipo_boleto ?? "—",
      item.competencia_mes ? `${String(item.competencia_mes).padStart(2, "0")}/${item.competencia_ano}` : item.competencia_ano,
      item.forma_pagamento ?? "—",
      item.boleto_pago ? "Sim" : "Não",
      item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    ]);

    autoTable(doc, {
      head: [["Data Rec.", "Data Boleto", "Nome", "CPF", "Tipo", "Competência", "Forma", "Boleto Pago", "Valor"]],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(
      `relatorio_daes_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  },
};
