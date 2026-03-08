import { Card, CardContent } from "@/shared/components/ui/card";
import { Table } from "@/shared/components/ui/table";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Send, FileUp, Search } from "lucide-react";
import { useState } from "react";
import { useReapListController } from "../../modules/reap/hooks/data/useReapData";
import { ReapTableHeader } from "../../modules/reap/components/table/ReapTableHeader";
import { ReapTableBody } from "../../modules/reap/components/table/ReapTableBody";
import { ReapTablePagination } from "../../modules/reap/components/table/ReapTablePagination";
import { ReapFilterPanel } from "../../modules/reap/components/ReapFilterPanel";
import { BulkSendDialog } from "../../modules/reap/components/BulkSendDialog";
import { ImportComprovantesDialog } from "../../modules/reap/components/ImportComprovantesDialog";
import { ConsultarPendenciasDialog } from "../../modules/reap/components/ConsultarPendenciasDialog";
import { SearchBar } from "@/modules/members/components/search/SearchBar";

export default function ReapPage() {
  const { search, table, pagination, filterPanel } = useReapListController();

  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConsultarOpen, setIsConsultarOpen] = useState(false);

  const headerActions = (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setIsConsultarOpen(true)}
      >
        <Search className="h-4 w-4" />
        Pendências Simplificado
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setIsImportOpen(true)}
      >
        <FileUp className="h-4 w-4" />
        Importar Comprovantes 2025
      </Button>
      <Button className="gap-2" onClick={() => setIsBulkSendOpen(true)}>
        <Send className="h-4 w-4" />
        Envio em Lote
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="REAP"
        description="Relatório de Exercício da Atividade Pesqueira — gestão de envios obrigatórios ao governo."
        actions={headerActions}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <SearchBar
          value={search.value}
          onChange={search.onChange}
          onOpenFilters={search.onOpenFilters}
          placeholder="Buscar por Nome ou CPF..."
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <ReapTableHeader />
              <ReapTableBody
                members={table.members}
                isLoading={table.isLoading}
                isFetching={table.isFetching}
                error={table.error}
                onRetry={table.refetch}
              />
            </Table>
          </div>

          <ReapTablePagination
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

      <ReapFilterPanel {...filterPanel} />

      <BulkSendDialog open={isBulkSendOpen} onOpenChange={setIsBulkSendOpen} />
      <ImportComprovantesDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <ConsultarPendenciasDialog open={isConsultarOpen} onOpenChange={setIsConsultarOpen} />
    </div>
  );
}
