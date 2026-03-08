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
import { toMemberListItem } from "@/modules/members/utils/memberTransformers";


import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Members() {
  const { search, table, pagination, filterPanel, deleteDialog, viewDialog } =
    useMembersListController();
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Sócios"
        description="Gerencie o cadastro de sócios, documentos e histórico."
      />

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
        memberUuid={viewDialog.memberUuid}
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
