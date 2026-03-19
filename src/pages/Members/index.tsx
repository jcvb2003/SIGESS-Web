import { Card, CardContent } from "@/shared/components/ui/card";
import { Table } from "@/shared/components/ui/table";
import { SearchBar } from "@/modules/members/components/search/SearchBar";
import { FilterPanel } from "@/modules/members/components/filters/FilterPanel";
import { MembersTableContainer } from "@/modules/members/components/table/MembersTableContainer";
import { MembersTableHeader } from "@/modules/members/components/table/MembersTableHeader";
import { MembersTableBody } from "@/modules/members/components/table/MembersTableBody";
import { MembersTablePagination } from "@/modules/members/components/table/MembersTablePagination";
import { MemberDeleteDialog } from "@/modules/members/components/dialogs/MemberDeleteDialog";
import { MemberDetailsModal } from "@/modules/members/components/modal/MemberDetailsModal";
import { useMembersListController } from "@/modules/members/hooks/data/useMemberData";
import type { MemberListItem } from "@/modules/members/types/member.types";
export default function Members() {
  const { search, table, pagination, filterPanel, deleteDialog, viewDialog } =
    useMembersListController();
  const toMemberListItem = (
    id: string,
    member: {
      codigoDoSocio?: string;
      nome?: string;
      cpf?: string;
      dataDeAdmissao?: string;
      situacao?: string;
      codigoLocalidade?: string;
    },
  ): MemberListItem => ({
    id,
    codigo_do_socio: member.codigoDoSocio ?? null,
    nome: member.nome ?? null,
    cpf: member.cpf ?? null,
    data_de_admissao: member.dataDeAdmissao ?? null,
    situacao: member.situacao ?? null,
    codigo_localidade: member.codigoLocalidade ?? null,
  });
  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex flex-col gap-1 md:gap-2">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            Sócios
          </h1>
          <p className="text-xs md:text-base text-muted-foreground hidden sm:block">
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
                <MembersTableHeader
                  sortConfig={table.sortConfig}
                  onSort={table.onSort}
                />
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
          viewDialog.onOpenChange(false);
          table.onEdit(toMemberListItem(id, member));
        }}
        onDocuments={(id, member) => {
          viewDialog.onOpenChange(false);
          table.onDocuments(toMemberListItem(id, member));
        }}
        onDelete={(id, member) => {
          viewDialog.onOpenChange(false);
          table.onDelete(toMemberListItem(id, member));
        }}
      />

      <FilterPanel {...filterPanel} />
    </div>
  );
}
