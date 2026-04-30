import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { ReportExportButtons } from "@/modules/reports/components/ReportExportButtons";
import { ReportFilters } from "@/modules/reports/components/ReportFilters";
import { useRequestsReport } from "@/modules/reports/hooks/useRequestsReport";
import { RequestsTable } from "@/modules/reports/components/requests/RequestsTable";
import { reportsService } from "@/modules/reports/services/reportsService";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErrorState } from "@/shared/components/feedback/ErrorState";

type ExportFormat = "excel" | "pdf";

const EXPORT_LABELS: Record<ExportFormat, { loading: string; success: string; error: string }> = {
  excel: {
    loading: "Gerando exportação Excel...",
    success: "Relatório Excel exportado com sucesso",
    error: "Erro ao exportar relatório Excel",
  },
  pdf: {
    loading: "Gerando PDF...",
    success: "PDF gerado com sucesso",
    error: "Erro ao gerar PDF",
  },
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("requerimentos");
  const [searchTerm, setSearchTerm] = useState("");
  const [carenciaFilter, setCarenciaFilter] = useState("all");

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
    error: requestsError,
    refetch,
  } = useRequestsReport(searchTerm, selectedReport, carenciaFilter, true);

  const handleExport = async (format: ExportFormat) => {
    const labels = EXPORT_LABELS[format];
    const toastId = toast.loading(labels.loading);
    try {
      const allData = await reportsService.fetchAllRequestsReport(
        searchTerm,
        selectedReport,
        carenciaFilter,
      );
      if (!allData || allData.length === 0) {
        toast.dismiss(toastId);
        toast.error("Não há dados para exportar");
        return;
      }
      if (format === "excel") {
        await reportsService.exportToExcel(allData);
      } else {
        await reportsService.exportToPdf(allData);
      }
      toast.dismiss(toastId);
      toast.success(labels.success);
    } catch (error) {
      console.error(`[Reports] Erro ao exportar ${format}:`, error);
      toast.dismiss(toastId);
      toast.error(labels.error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Relatórios"
        description="Visualize e exporte dados essenciais e estatísticas do sistema."
        actions={
          <ReportExportButtons
            onExportExcel={() => handleExport("excel")}
            onExportPdf={() => handleExport("pdf")}
          />
        }
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <ReportFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedReport={selectedReport}
          onReportChange={setSelectedReport}
          carenciaFilter={carenciaFilter}
          onCarenciaChange={setCarenciaFilter}
        />

        {requestsError ? (
          <div className="p-8">
            <ErrorState
              title="Erro ao carregar relatório"
              message="Não foi possível recuperar os dados para este relatório. Verifique sua conexão ou tente novamente."
              onRetry={() => refetch()}
            />
          </div>
        ) : (
          (selectedReport === "requerimentos" || selectedReport === "nao_assinados") && (
            <RequestsTable
              data={requestsData}
              isLoading={requestsLoading || isFetching}
              onDelete={selectedReport === "requerimentos" ? deleteRequest : undefined}
              pagination={{ page, pageSize, total, totalPages, setPage, setPageSize }}
            />
          )
        )}
      </Card>
    </div>
  );
}
