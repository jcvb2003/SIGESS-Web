import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { FileSpreadsheet, FileText, Download, Printer } from 'lucide-react'
import { useDataImportExport } from '../../../hooks/useDataManagement'

interface ExportDialogProps {
  trigger?: React.ReactNode
}

export function ExportDialog({ trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const { isExporting, exportToCsv, exportToXlsx } = useDataImportExport()

  const handleExportCsv = async () => {
    await exportToCsv()
    setOpen(false)
  }

  const handleExportXlsx = async () => {
    await exportToXlsx()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="justify-between w-full">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Dados
            </div>
            <span className="text-xs text-muted-foreground">CSV / Excel</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Escolha o formato para exportar os dados dos sócios.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-4 px-6"
            onClick={handleExportXlsx}
            disabled={isExporting}
          >
            <FileSpreadsheet className="mr-4 h-6 w-6 text-green-600" />
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold">Excel (XLSX)</span>
              <span className="text-xs text-muted-foreground">
                Planilha formatada para Microsoft Excel
              </span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start h-auto py-4 px-6"
            onClick={handleExportCsv}
            disabled={isExporting}
          >
            <FileText className="mr-4 h-6 w-6 text-blue-600" />
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold">CSV (UTF-8)</span>
              <span className="text-xs text-muted-foreground">
                Arquivo de texto separado por vírgulas
              </span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start h-auto py-4 px-6 opacity-50 cursor-not-allowed"
            disabled={true}
          >
            <Printer className="mr-4 h-6 w-6 text-gray-500" />
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold">PDF (Em breve)</span>
              <span className="text-xs text-muted-foreground">
                Relatório formatado para impressão
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
