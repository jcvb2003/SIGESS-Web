import { Button } from '@/shared/components/ui/button'
import { Printer, FileSpreadsheet } from 'lucide-react'

interface ReportExportButtonsProps {
  onExportExcel?: () => void
  onExportPdf?: () => void
}

export function ReportExportButtons({ onExportExcel, onExportPdf }: ReportExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="outline" className="gap-2" onClick={onExportExcel} type="button">
        <FileSpreadsheet className="h-4 w-4" />
        <span className="hidden sm:inline">Exportar Excel</span>
      </Button>
      <Button className="shadow-sm" onClick={onExportPdf} type="button">
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Imprimir PDF</span>
      </Button>
    </div>
  )
}
