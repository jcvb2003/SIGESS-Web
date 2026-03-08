
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { FileText } from 'lucide-react'
import { RequestReportItem } from '../../services/reportsService'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface RequestsTableProps {
  data: RequestReportItem[]
  isLoading: boolean
}

export function RequestsTable({ data, isLoading }: RequestsTableProps) {
  const navigate = useNavigate()

  const handleOpenDocuments = (item: RequestReportItem) => {
    if (item.socio_id) {
      navigate('/documents', { 
        state: { 
          member: { 
            id: String(item.socio_id), 
            name: item.nome 
          } 
        } 
      })
    } else {
      toast.error("Sócio não vinculado a este requerimento.")
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>
  }

  return (
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow>
              <TableHead className="w-[100px]">Protocolo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Sócio/Requerente</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>RGP</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.cod_req_inss}>
                  <TableCell className="font-medium">{item.protocolo || item.cod_req_inss}</TableCell>
                  <TableCell>
                    {item.data_req && !isNaN(new Date(item.data_req).getTime()) 
                      ? format(new Date(item.data_req), 'dd/MM/yyyy') 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.cpf}</TableCell>
                  <TableCell>
                    {item.rgp || item.emb_rgp || '-'}
                  </TableCell>
                  <TableCell>
                    {item.tipo_requerimento || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Gerar Documentos"
                        onClick={() => handleOpenDocuments(item)}
                        disabled={!item.socio_id}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}
