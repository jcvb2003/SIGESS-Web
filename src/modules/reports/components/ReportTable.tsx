import { CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { FileText } from 'lucide-react'

export function ReportTable() {
  return (
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow>
              <TableHead className="w-[100px] px-6 py-4">Data</TableHead>
              <TableHead className="px-6 py-4">Sócio/Requerente</TableHead>
              <TableHead className="px-6 py-4">Tipo de Documento</TableHead>
              <TableHead className="px-6 py-4">Status</TableHead>
              <TableHead className="text-right px-6 py-4">Protocolo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <p>Utilize os filtros acima para gerar o relatório.</p>
                  <Button variant="outline" size="sm" className="mt-2" type="button">
                    Carregar Dados
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}
