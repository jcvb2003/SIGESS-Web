import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useRequirementsListController } from "../../modules/requirements/hooks/data/useRequirementData";
import { DataTable, ColumnDef } from "@/shared/components/layout/DataTable";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { RequirementsFilterPanel } from "../../modules/requirements/components/RequirementsFilterPanel";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { Button } from "@/shared/components/ui/button";
import { FileUp, Plus, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { RequirementDetailsModal } from "../../modules/requirements/components/RequirementDetailsModal";
import { ImportPortalDialog } from "../../modules/requirements/components/ImportPortalDialog";
import { RequirementWithMember } from "../../modules/requirements/types/requirement.types";
import { StatusBadge, StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { MemberCpfCell } from "../../modules/members/components/table/cells/MemberCpfCell";

export default function RequirementsPage() {
  const { 
    search, 
    table, 
    pagination, 
    filterPanel,
  } = useRequirementsListController();

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const columns = useMemo<ColumnDef<RequirementWithMember>[]>(() => [
    {
      header: "Sócio",
      skeletonVariant: "text",
      skeletonWidth: "w-48",
      cell: (req) => (
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium text-foreground/90 uppercase">
            {req.member_nome}
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground truncate opacity-70">
            NIT: {req.member_nit || "---"}
          </span>
        </div>
      )
    },
    {
      header: "CPF",
      className: "whitespace-nowrap",
      cell: (req) => <MemberCpfCell cpf={req.cpf} />
    },
    {
      header: "Data de assinatura",
      className: "whitespace-nowrap font-medium",
      cell: (req) => {
        if (!req.data_assinatura) return <span className="text-muted-foreground opacity-50">---</span>;
        
        try {
          const date = parseISO(req.data_assinatura);
          if (!isValid(date)) throw new Error("Invalid date");
          return (
            <span className="text-foreground/90 tabular-nums">
              {format(date, "dd/MM/yyyy")}
            </span>
          );
        } catch {
          return <span className="text-muted-foreground opacity-50">---</span>;
        }
      }
    },
    {
      header: "Data do RGP",
      className: "whitespace-nowrap font-medium",
      cell: (req) => {
        if (!req.member_emissao_rgp) return <span className="text-muted-foreground opacity-50">---</span>;
        
        try {
          const date = parseISO(req.member_emissao_rgp);
          if (!isValid(date)) throw new Error("Invalid date");
          return (
            <span className="text-foreground/90 tabular-nums">
              {format(date, "dd/MM/yyyy")}
            </span>
          );
        } catch {
          return <span className="text-muted-foreground opacity-50">---</span>;
        }
      }
    },
    {
      header: "Ano",
      skeletonVariant: "badge",
      cell: (req) => (
        <StatusBadge 
          variant="info" 
          label={req.ano_referencia} 
        />
      )
    },
    {
      header: "Status",
      skeletonVariant: "badge",
      cell: (req) => {
        const isDeferido = req.status_mte === "deferido";
        const isIndeferido = req.status_mte === "indeferido";
        const isPago = req.beneficio_recebido;
        
        let variant: StatusBadgeVariant = "info";
        let label = "EM ANÁLISE";

        if (isPago) {
          variant = "success";
          label = "PAGO";
        } else if (isDeferido) {
          variant = "success";
          label = "DEFERIDO";
        } else if (isIndeferido) {
          variant = "destructive";
          label = "INDEFERIDO";
        } else if (req.status_mte === 'assinado') {
          variant = "warning";
          label = "ASSINADO";
        } else if (req.status_mte === 'recurso_acerto') {
          variant = "orange";
          label = "RECURSO / ACERTO";
        } else if (req.status_mte === 'nao_assinado') {
          variant = "outline";
          label = "NÃO ASSINOU";
        }

        return <StatusBadge variant={variant} label={label} />;
      }
    },
    {
      header: "Financeiro",
      skeletonVariant: "badge",
      cell: (req) => {
        const situacao = req.situacao_financeira;
        
        let variant: StatusBadgeVariant = "destructive";
        let label = "EM ATRASO";

        if (situacao === 'em_dia') {
          variant = "success";
          label = "EM DIA";
        } else if (situacao === 'isento') {
          variant = "info";
          label = "ISENTO";
        }

        return <StatusBadge variant={variant} label={label} />;
      }
    },
    {
      header: "Req. MTE",
      className: "text-sm text-muted-foreground/70",
      cell: (req) => req.num_req_mte || "---"
    },
    {
      header: "Ações",
      headerClassName: "text-right px-4",
      skeletonVariant: "button",
      className: "text-right w-[1%] px-4",
      cell: (req) => {
        if (req.status_mte === 'nao_assinado' || !req.id) return null;
        
        return (
          <div className="flex justify-end items-center gap-2">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReqId(req.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={5}>Visualizar Requerimento</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
    }
  ], []);

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
        description="Gestão de protocolos, status MTE e integração com Portal da Transparência."
        actions={headerActions}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <DataTableSearch
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
            columns={columns}
          />

          <DataTablePagination
            total={pagination.total}
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            isLoading={pagination.isLoading}
            isFetching={pagination.isFetching}
            onPageSizeChange={pagination.onPageSizeChange}
            onPreviousPage={pagination.onPreviousPage}
            onNextPage={pagination.onNextPage}
            entityName="requerimentos"
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
