
import { CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Filter, Search } from 'lucide-react'

interface ReportFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedReport: string
  onReportChange: (value: string) => void
}

export function ReportFilters({ 
  searchTerm, 
  onSearchChange, 
  selectedReport, 
  onReportChange 
}: ReportFiltersProps) {
  return (
    <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filtros do Relatório
        </CardTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, CPF ou protocolo..." 
              className="pl-9 w-full lg:w-64 bg-background" 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <Select value={selectedReport} onValueChange={onReportChange}>
            <SelectTrigger className="w-full lg:w-[250px] bg-background">
              <SelectValue placeholder="Tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gerid">Assinaturas</SelectItem>
              <SelectItem value="members">Sócios Ativos (Em breve)</SelectItem>
              <SelectItem value="inadimplentes">Inadimplentes (Em breve)</SelectItem>
              <SelectItem value="aniversariantes">Aniversariantes (Em breve)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardHeader>
  )
}
