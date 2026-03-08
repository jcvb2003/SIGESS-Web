
import { useState } from 'react'
import { Card } from '@/shared/components/ui/card'
import { ReportExportButtons } from '@/modules/reports/components/ReportExportButtons'
import { ReportFilters } from '@/modules/reports/components/ReportFilters'
import { ReportTable } from '@/modules/reports/components/ReportTable'
import { ReportSummary } from '@/modules/reports/components/ReportSummary'
import { useRequestsReport } from '@/modules/reports/hooks/useRequestsReport'
import { RequestsTable } from '@/modules/reports/components/requests/RequestsTable'

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('gerid')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch requests only if selected
  const { 
    data: requestsData, 
    isLoading: requestsLoading 
  } = useRequestsReport(searchTerm, selectedReport === 'gerid')

  const handleExportExcel = () => {
    // TODO: Implement export
    console.log('Exporting Excel', selectedReport)
  }

  const handleExportPdf = () => {
    // TODO: Implement export
    console.log('Exporting PDF', selectedReport)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize e exporte dados essenciais e estatísticas do sistema.
          </p>
        </div>
        <ReportExportButtons 
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
        />
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <ReportFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedReport={selectedReport}
          onReportChange={setSelectedReport}
        />
        
        {selectedReport === 'gerid' ? (
          <RequestsTable data={requestsData} isLoading={requestsLoading} />
        ) : (
          <ReportTable />
        )}
      </Card>

      <ReportSummary />
    </div>
  )
}
