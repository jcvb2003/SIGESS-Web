import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

interface ReportExportButtonsProps {
  onExportExcel?: () => void | Promise<void>;
  onExportPdf?: () => void | Promise<void>;
}

export function ReportExportButtons({
  onExportExcel,
  onExportPdf,
}: ReportExportButtonsProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (action?: () => void | Promise<void>) => {
    if (!action) return;

    setIsExporting(true);
    try {
      await action();
      setOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[190px]">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </div>
          <span className="text-xs text-muted-foreground">PDF / Excel</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Escolha o formato para exportar ou imprimir este relatório.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-4 px-6"
            onClick={() => void handleExport(onExportExcel)}
            disabled={isExporting}
          >
            <FileSpreadsheet className="mr-4 h-6 w-6 text-success" />
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold">Excel</span>
              <span className="text-xs text-muted-foreground">
                Planilha formatada para análise e conferência
              </span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start h-auto py-4 px-6"
            onClick={() => void handleExport(onExportPdf)}
            disabled={isExporting}
          >
            <Printer className="mr-4 h-6 w-6 text-blue-600" />
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold">PDF</span>
              <span className="text-xs text-muted-foreground">
                Relatório formatado para impressão
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
