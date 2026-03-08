import { Card, CardContent } from "@/shared/components/ui/card";
import { Table } from "@/shared/components/ui/table";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useRequirementsListController } from "../../modules/requirements/hooks/data/useRequirementData";
import { RequirementsTableBody } from "../../modules/requirements/components/table/RequirementsTableBody";
import { RequirementsTableHeader } from "../../modules/requirements/components/table/RequirementsTableHeader";
import { RequirementsTablePagination } from "../../modules/requirements/components/table/RequirementsTablePagination";
import { RequirementsFilterPanel } from "../../modules/requirements/components/RequirementsFilterPanel";
import { SearchBar } from "@/modules/members/components/search/SearchBar";
import { Button } from "@/shared/components/ui/button";
import { FileUp, Plus } from "lucide-react";
import { useState } from "react";
import { RequirementDetailsModal } from "../../modules/requirements/components/RequirementDetailsModal";
import { ImportPortalDialog } from "../../modules/requirements/components/ImportPortalDialog";

export default function RequirementsPage() {
  const { 
    search, 
    table, 
    pagination, 
    filterPanel,
  } = useRequirementsListController();

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => setIsImportOpen(true)}
      >
        <FileUp className="h-4 w-4" />
        Importar Portal
      </Button>
      <Button className="gap-2" onClick={() => {}}>
        <Plus className="h-4 w-4" />
        Novo Requerimento
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Requerimentos de Seguro Defeso"
        description="Gestao de protocolos, status MTE e integracao com Portal da Transparencia."
        actions={headerActions}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <SearchBar
          value={search.value}
          onChange={search.onChange}
          onOpenFilters={search.onOpenFilters}
          placeholder="Buscar por Nome, CPF ou Protocolo..."
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <RequirementsTableHeader />
              <RequirementsTableBody
                requirements={table.requirements}
                isLoading={table.isLoading}
                isFetching={table.isFetching}
                error={table.error}
                onRetry={table.refetch}
                onViewDetail={setSelectedReqId}
              />
            </Table>
          </div>

          <RequirementsTablePagination
            total={pagination.total}
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            isLoading={pagination.isLoading}
            isFetching={pagination.isFetching}
            onPageSizeChange={pagination.onPageSizeChange}
            onPreviousPage={pagination.onPreviousPage}
            onNextPage={pagination.onNextPage}
          />
        </CardContent>
      </Card>

      <RequirementsFilterPanel {...filterPanel} />

      <RequirementDetailsModal 
        requirementId={selectedReqId}
        onOpenChange={(open) => {
          if (!open) setSelectedReqId(null);
        }}
      />

      <ImportPortalDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        anoAtual={filterPanel.yearFilter}
      />
    </div>
  );
}
