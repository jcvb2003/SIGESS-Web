import { DataTable } from "@/shared/components/layout/DataTable";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useRequirementsListController } from "../../modules/requirements/hooks/data/useRequirementData";
import { RequirementsTablePagination } from "../../modules/requirements/components/table/RequirementsTablePagination";
import { RequirementsFilterPanel } from "../../modules/requirements/components/RequirementsFilterPanel";
import { SearchBar } from "@/modules/members/components/search/SearchBar";
import { Button } from "@/shared/components/ui/button";
import { FileUp, Plus, Eye } from "lucide-react";
import { useState } from "react";
import { RequirementDetailsModal } from "../../modules/requirements/components/RequirementDetailsModal";
import { ImportPortalDialog } from "../../modules/requirements/components/ImportPortalDialog";
import { RequirementWithMember } from "../../modules/requirements/types/requirement.types";
import { StatusBadge } from "../../modules/requirements/components/StatusBadge";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

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
          <DataTable<RequirementWithMember>
            data={table.requirements}
            isLoading={table.isLoading}
            error={table.error as Error}
            onRetry={table.refetch}
            onRowClick={(req) => setSelectedReqId(req.id)}
            emptyMessage="Nenhum requerimento encontrado"
            emptyDescription="Ajuste os filtros ou cadastre um novo protocolo para começar."
            columns={[
              {
                header: "Protocolo",
                className: "font-mono text-sm font-semibold text-primary whitespace-nowrap",
                cell: (req) => req.cod_req
              },
              {
                header: "Sócio",
                skeletonVariant: "text",
                skeletonWidth: "w-48",
                cell: (req) => {
                  const isEmDia = req.situacao_financeira === 'em_dia';
                  const isIsento = req.situacao_financeira === 'isento';
                  
                  let statusColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse";
                  let statusTitle = "Financeiro: Em Atraso";

                  if (isEmDia) {
                    statusColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                    statusTitle = "Financeiro: Em Dia";
                  } else if (isIsento) {
                    statusColor = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
                    statusTitle = "Financeiro: Isento";
                  }

                  return (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {req.member_nome}
                        </span>
                        <div
                          className={cn("w-2 h-2 rounded-full", statusColor)}
                          title={statusTitle}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        NIT: {req.member_nit || "---"}
                      </span>
                    </div>
                  );
                }
              },
              {
                header: "CPF",
                className: "text-sm text-muted-foreground font-mono",
                cell: (req) => req.cpf
              },
              {
                header: "Ano",
                skeletonVariant: "badge",
                skeletonWidth: "w-12",
                cell: (req) => (
                  <span className="px-2 py-1 rounded bg-muted text-xs font-bold">
                    {req.ano_referencia}
                  </span>
                )
              },
              {
                header: "Status",
                skeletonVariant: "badge",
                cell: (req) => <StatusBadge status={req.status_mte} />
              },
              {
                header: "Financeiro",
                skeletonVariant: "badge",
                cell: (req) => req.beneficio_recebido ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-sm">
                    RECEBIDO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                    AGUARDANDO
                  </span>
                )
              },
              {
                header: "Req. MTE",
                className: "text-sm font-medium",
                cell: (req) => req.num_req_mte || "---"
              },
              {
                header: "",
                skeletonVariant: "button",
                cell: (req) => (
                  <div className="flex justify-end items-center gap-2">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReqId(req.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>Visualizar Requerimento</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )
              }
            ]}
          />

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
