import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { FileSpreadsheet } from 'lucide-react'
import { ImportDialog } from './dialogs/ImportDialog'
import { ExportDialog } from './dialogs/ExportDialog'

export function ImportExportCard() {
  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Importação e Exportação
        </CardTitle>
        <CardDescription>
          Importe e exporte sócios em planilhas CSV para backup ou migração.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
        <ImportDialog />
        <ExportDialog />
      </CardContent>
    </Card>
  )
}
