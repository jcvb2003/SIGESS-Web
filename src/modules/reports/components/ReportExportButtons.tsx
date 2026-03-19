import { Button } from "@/shared/components/ui/button";
import { Printer, FileSpreadsheet } from "lucide-react";
interface ReportExportButtonsProps {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
}
export function ReportExportButtons({
  onExportExcel,
  onExportPdf,
}: ReportExportButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
      <Button
        variant="outline"
        className="gap-2 flex-1 sm:flex-initial"
        onClick={onExportExcel}
        type="button"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span className="inline">Exportar Excel</span>
      </Button>
      <Button
        className="shadow-sm gap-2 flex-1 sm:flex-initial"
        onClick={onExportPdf}
        type="button"
      >
        <Printer className="h-4 w-4" />
        <span className="inline">Imprimir PDF</span>
      </Button>
    </div>
  );
}
