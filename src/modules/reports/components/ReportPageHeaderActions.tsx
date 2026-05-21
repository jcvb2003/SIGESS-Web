import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ReportExportButtons } from "./ReportExportButtons";

interface ReportPageHeaderActionsProps {
  readonly onExportExcel?: () => void | Promise<void>;
  readonly onExportPdf?: () => void | Promise<void>;
  readonly onBack?: () => void;
  readonly extraActions?: ReactNode;
  readonly showExport?: boolean;
}

export function ReportPageHeaderActions({
  onExportExcel,
  onExportPdf,
  onBack,
  extraActions,
  showExport = true,
}: ReportPageHeaderActionsProps) {
  return (
    <div className="flex items-center gap-3 print:hidden">
      {showExport && (
        <ReportExportButtons
          onExportExcel={onExportExcel}
          onExportPdf={onExportPdf}
        />
      )}

      {extraActions}

      {onBack && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="rounded-xl h-10 px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      )}
    </div>
  );
}
