import { Card, CardContent } from "@/shared/components/ui/card";
import { SearchBar } from "@/modules/members/components/search/SearchBar";
import { FilterPanel } from "@/modules/members/components/filters/FilterPanel";
import { MembersTablePagination } from "@/modules/members/components/table/MembersTablePagination";
import { MemberDeleteDialog } from "@/modules/members/components/dialogs/MemberDeleteDialog";
import { MemberDetailsModal } from "@/modules/members/components/modal/MemberDetailsModal";
import { DataTable } from "@/shared/components/layout/DataTable";
import { MemberBasicInfoCell } from "@/modules/members/components/table/cells/MemberBasicInfoCell";
import { MemberCpfCell } from "@/modules/members/components/table/cells/MemberCpfCell";
import { MemberDateCell } from "@/modules/members/components/table/cells/MemberDateCell";
import { MemberStatusCell } from "@/modules/members/components/table/cells/MemberStatusCell";
import { MembersTableActions } from "@/modules/members/components/table/MembersTableActions";
import { useLocalitiesData } from "@/modules/members/hooks/data/useLocalitiesData";
import { MemberListItem } from "@/modules/members/types/member.types";
import { useMembersListController } from "@/modules/members/hooks/data/useMemberData";
import { toMemberListItem } from "@/modules/members/utils/memberTransformers";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export default function Members() {
  const { search, table, pagination, filterPanel, deleteDialog, viewDialog } =
    useMembersListController();
  const { localities } = useLocalitiesData();

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
          <DataTable<MemberListItem>
            data={table.members}
            isLoading={table.isLoading}
            error={table.error}
            onRetry={table.refetch}
            onRowClick={table.onView}
            emptyMessage="Nenhum sócio encontrado"
            emptyDescription="Tente ajustar seus filtros ou termos de busca para encontrar o que procura."
            columns={[
              {
                header: "Sócio",
                className: "w-full min-w-[200px]",
                sortable: true,
                sortDirection: table.sortConfig.field === "nome" ? table.sortConfig.direction : null,
                onSort: () => table.onSort("nome"),
                skeletonVariant: "circle",
                cell: (m) => (
                  <MemberBasicInfoCell 
                    name={m.nome} 
                    code={m.codigo_do_socio} 
                    photoUrl={m.foto_url}
                  />
                )
              },
              {
                header: "CPF",
                className: "whitespace-nowrap",
                sortable: true,
                sortDirection: table.sortConfig.field === "cpf" ? table.sortConfig.direction : null,
                onSort: () => table.onSort("cpf"),
                cell: (m) => <MemberCpfCell cpf={m.cpf} />
              },
              {
                header: "Localidade",
                className: "whitespace-nowrap hidden lg:table-cell",
                cell: (m) => {
                  const localityName = localities.find((l) => l.code === m.codigo_localidade)?.name || "-";
                  return <span className="text-sm text-muted-foreground">{localityName}</span>;
                }
              },
              {
                header: "Data de filiação",
                className: "whitespace-nowrap hidden md:table-cell",
                sortable: true,
                sortDirection: table.sortConfig.field === "data_de_admissao" ? table.sortConfig.direction : null,
                onSort: () => table.onSort("data_de_admissao"),
                cell: (m) => <MemberDateCell value={m.data_de_admissao} />
              },
              {
                header: "Status",
                skeletonVariant: "badge",
                skeletonWidth: "w-20",
                cell: (m) => <MemberStatusCell status={m.situacao} />
              },
              {
                header: "Ações",
                headerClassName: "text-right",
                className: "text-right w-[1%]",
                skeletonVariant: "button",
                cell: (m) => (
                  <div onClick={(e) => e.stopPropagation()}>
                    <MembersTableActions
                      onEdit={() => table.onEdit(m)}
                      onDocuments={() => table.onDocuments(m)}
                      onDelete={() => table.onDelete(m)}
                    />
                  </div>
                )
              }
            ]}
          />

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
