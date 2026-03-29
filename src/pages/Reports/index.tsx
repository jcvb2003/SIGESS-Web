import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { ReportExportButtons } from "@/modules/reports/components/ReportExportButtons";
import { ReportFilters } from "@/modules/reports/components/ReportFilters";
import { useRequestsReport } from "@/modules/reports/hooks/useRequestsReport";
import { RequestsTable } from "@/modules/reports/components/requests/RequestsTable";
import { reportsService } from "@/modules/reports/services/reportsService";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("requerimentos");
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: requestsData,
    isLoading: requestsLoading,
    deleteRequest,
    total,
    totalPages,
    page,
    pageSize,
    setPage,
    setPageSize,
    isFetching,
  } = useRequestsReport(searchTerm, selectedReport === "requerimentos");

  const handleExportExcel = async () => {
    let toastId: string | number | undefined;
    try {
      toastId = toast.loading("Gerando exportação Excel...");
      const allData = await reportsService.fetchAllRequestsReport(searchTerm);

      if (!allData || allData.length === 0) {
        toast.dismiss(toastId);
        toast.error("Não há dados para exportar");
        return;
      }

      // Format data for Excel
      const excelData = allData.map((item) => ({
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

      toast.dismiss(toastId);
      toast.success("Relatório Excel exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.dismiss(toastId);
      toast.error("Erro ao exportar relatório Excel");
    }
  };

  const handleExportPdf = async () => {
    let toastId: string | number | undefined;
    try {
      toastId = toast.loading("Gerando PDF...");
      const allData = await reportsService.fetchAllRequestsReport(searchTerm);

      if (!allData || allData.length === 0) {
        toast.dismiss(toastId);
        toast.error("Não há dados para exportar");
        return;
      }

      const doc = new jsPDF();
      doc.text("Relatório de Assinaturas", 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 22);

      const tableData = allData.map((item) => [
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

      toast.dismiss(toastId);
      toast.success("PDF gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.dismiss(toastId);
      toast.error("Erro ao gerar PDF");
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Visualize e exporte dados essenciais e estatísticas do sistema.
          </p>
        </div>
        <ReportExportButtons
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
        />
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <ReportFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedReport={selectedReport}
          onReportChange={setSelectedReport}
        />

        {selectedReport === "requerimentos" && (
          <RequestsTable
            data={requestsData}
            isLoading={requestsLoading || isFetching}
            onDelete={deleteRequest}
            pagination={{
              page,
              pageSize,
              total,
              totalPages,
              setPage,
              setPageSize,
            }}
          />
        )}
      </Card>
    </div>
  );
}
