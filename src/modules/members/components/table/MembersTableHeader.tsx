import { TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'

export function MembersTableHeader() {
  return (
    <TableHeader className="bg-muted/20">
      <TableRow>
        <TableHead className="px-6 py-4">Sócio</TableHead>
        <TableHead className="px-6 py-4">CPF</TableHead>
        <TableHead className="px-6 py-4">Filiação</TableHead>
        <TableHead className="px-6 py-4">Situação</TableHead>
        <TableHead className="text-right px-6 py-4">Ações</TableHead>
      </TableRow>
    </TableHeader>
  )
}
