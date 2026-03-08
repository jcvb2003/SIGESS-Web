import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { ReportExportButtons } from "@/modules/reports/components/ReportExportButtons";
import { ReportFilters } from "@/modules/reports/components/ReportFilters";
import { useRequestsReport } from "@/modules/reports/hooks/useRequestsReport";
import { RequestsTable } from "@/modules/reports/components/requests/RequestsTable";
import { reportsService } from "@/modules/reports/services/reportsService";
import { toast } from "sonner";


import { PageHeader } from "@/shared/components/layout/PageHeader";

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

      await reportsService.exportToExcel(allData);

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

      await reportsService.exportToPdf(allData);

      toast.dismiss(toastId);
      toast.success("PDF gerado com sucesso");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.dismiss(toastId);
      toast.error("Erro ao gerar PDF");
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Relatórios"
        description="Visualize e exporte dados essenciais e estatísticas do sistema."
        actions={
          <ReportExportButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        }
      />

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
