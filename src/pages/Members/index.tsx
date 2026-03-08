import { Card, CardContent } from '@/shared/components/ui/card'
import { Table } from '@/shared/components/ui/table'
import { SearchBar } from '@/modules/members/components/search/SearchBar'
import { FilterPanel } from '@/modules/members/components/filters/FilterPanel'
import { MembersTableContainer } from '@/modules/members/components/table/MembersTableContainer'
import { MembersTableHeader } from '@/modules/members/components/table/MembersTableHeader'
import { MembersTableBody } from '@/modules/members/components/table/MembersTableBody'
import { MembersTablePagination } from '@/modules/members/components/table/MembersTablePagination'
import { MemberDeleteDialog } from '@/modules/members/components/dialogs/MemberDeleteDialog'
import { MemberDetailsModal } from '@/modules/members/components/modal/MemberDetailsModal'
import { useMembersListController } from '@/modules/members/hooks/data/useMemberData'
import type { MemberListItem } from '@/modules/members/types/member.types'

export default function Members() {
  const { search, table, pagination, filterPanel, deleteDialog, viewDialog } = useMembersListController()

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Sócios</h1>
          <p className="text-muted-foreground">
            Gerencie o cadastro de sócios, documentos e histórico.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <SearchBar
          value={search.value}
          onChange={search.onChange}
          onOpenFilters={search.onOpenFilters}
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <MembersTableContainer>
              <Table>
                <MembersTableHeader />
                <MembersTableBody
                  members={table.members}
                  isLoading={table.isLoading}
                  isFetching={table.isFetching}
                  error={table.error}
                  onRetry={table.refetch}
                  onView={table.onView}
                  onEdit={table.onEdit}
                  onDocuments={table.onDocuments}
                  onDelete={table.onDelete}
                />
              </Table>
            </MembersTableContainer>
          </div>

          <MembersTablePagination
            total={pagination.total}
            page={pagination.page}
            pageSize={pagination.pageSize}
            showingCount={pagination.showingCount}
            startIndex={pagination.startIndex}
            totalPages={pagination.totalPages}
            isLoading={pagination.isLoading}
            isFetching={pagination.isFetching}
            onPageSizeChange={pagination.onPageSizeChange}
            onPreviousPage={pagination.onPreviousPage}
            onNextPage={pagination.onNextPage}
          />
        </CardContent>
      </Card>

      <MemberDeleteDialog
        open={deleteDialog.open}
        onOpenChange={deleteDialog.onOpenChange}
        onConfirm={deleteDialog.onConfirm}
        isDeleting={deleteDialog.isDeleting}
      />

      <MemberDetailsModal
        open={viewDialog.open}
        onOpenChange={viewDialog.onOpenChange}
        memberId={viewDialog.memberId}
        onEdit={(id, member) => {
          viewDialog.onOpenChange(false)
          table.onEdit({ id, ...member } as unknown as MemberListItem)
        }}
        onDocuments={(id, member) => {
          viewDialog.onOpenChange(false)
          table.onDocuments({
            id,
            nome: member.nome,
            codigo_do_socio: member.codigoDoSocio,
            cpf: member.cpf,
          } as unknown as MemberListItem)
        }}
        onDelete={(id) => {
          viewDialog.onOpenChange(false)
          table.onDelete({ id } as unknown as MemberListItem)
        }}
      />

      <FilterPanel {...filterPanel} />
    </div>
  )
}
