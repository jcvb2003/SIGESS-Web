import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'

export function ReportSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Total Registros</CardDescription>
          <CardTitle className="text-3xl font-bold">0</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Aprovados</CardDescription>
          <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">0</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Pendentes</CardDescription>
          <CardTitle className="text-3xl font-bold text-amber-600 dark:text-amber-500">0</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
