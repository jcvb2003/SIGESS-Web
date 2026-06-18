import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { FileUp, Search, AlertTriangle, Settings2, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useReapListController } from "../../modules/reap/hooks/data/useReapData";
import { DataTable } from "@/shared/components/layout/DataTable";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { ReapFilterPanel } from "../../modules/reap/components/ReapFilterPanel";
import { ImportComprovantesDialog } from "../../modules/reap/components/ImportComprovantesDialog";
import { ConsultarPendenciasDialog } from "../../modules/reap/components/ConsultarPendenciasDialog";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { ReapStatusBadge } from "../../modules/reap/components/ReapStatusBadge";
import { ManageReapDialog } from "../../modules/reap/components/ManageReapDialog";
import { ReapWithMember, ANOS_SIMPLIFICADO } from "../../modules/reap/types/reap.types";
import { getApplicableYears } from "../../modules/reap/domain/reapDomain";
import { Badge } from "@/shared/components/ui/badge";
import { MemberCpfCell } from "../../modules/members/components/table/cells/MemberCpfCell";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";


export default function ReapPage() {
  const { search, table, pagination, filterPanel } = useReapListController();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConsultarOpen, setIsConsultarOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ReapWithMember | null>(null);

  const headerActions = useMemo(() => (
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
    </div>
  ), []);

  const columns = useMemo(() => [
    {
      header: "Sócio",
      className: "min-w-[200px]",
      cell: (m: ReapWithMember) => (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground/90 uppercase">
              {m.member_nome ?? "—"}
            </span>
            {(Object.values(m.simplificado).some((a) => a.tem_problema) ||
              Object.values(m.anual).some((a) => a.tem_problema)) && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground truncate opacity-70">
            NIT: {m.member_nit || "---"}
          </span>
        </div>
      )
    },
    {
      header: "CPF",
      className: "whitespace-nowrap",
      cell: (m: ReapWithMember) => <MemberCpfCell cpf={m.cpf} />
    },
    {
      header: "RGP",
      headerClassName: "text-center",
      className: "text-center",
      cell: (m: ReapWithMember) => m.emissao_rgp ? (
        <StatusBadge
          variant="info"
          label={new Date(m.emissao_rgp).getFullYear()}
        />
      ) : (
        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">NÃO INFORMADO</Badge>
      )
    },
    ...ANOS_SIMPLIFICADO.map((ano) => ({
      header: String(ano),
      headerClassName: "text-center",
      className: "text-center",
      cell: (m: ReapWithMember) => {
        const obrigatorio = getApplicableYears(m.emissao_rgp, "simplificado").includes(ano);
        const anoData = m.simplificado[String(ano)];
        if (!obrigatorio) return <span className="text-muted-foreground/30 text-xs">—</span>;
        return (
          <ReapStatusBadge
            enviado={anoData?.enviado ?? false}
            tem_problema={anoData?.tem_problema ?? false}
            obs={anoData?.obs}
            label={anoData?.enviado ? "OK" : "PENDENTE"}
          />
        );
      }
    })),
    {
      header: "REAP 2025",
      headerClassName: "text-center",
      className: "text-center",
      cell: (m: ReapWithMember) => {
        const anosAnualObrigatorios = getApplicableYears(m.emissao_rgp, "anual");
        if (anosAnualObrigatorios.length === 0) return <span className="text-muted-foreground/30 text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {anosAnualObrigatorios.map((ano) => {
              const anoData = m.anual[String(ano)];
              return (
                <ReapStatusBadge
                  key={ano}
                  enviado={anoData?.enviado ?? false}
                  tem_problema={anoData?.tem_problema ?? false}
                  obs={anoData?.obs}
                  label={String(ano)}
                />
              );
            })}
          </div>
        );
      }
    },
    {
      header: "Ações",
      headerClassName: "text-right px-14",
      className: "text-right px-6",
      cell: (m: ReapWithMember) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMember(m);
            }}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Gerenciar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary"
            onClick={(e) => e.stopPropagation()}
            asChild
          >
            <a
              href="https://www.gov.br/mpa/pt-br/assuntos/cadastro-registro-e-monitoramento/pescador-e-pescadora-profissional"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              PesqBrasil
            </a>
          </Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="REAP"
        description="Relatório de Exercício da Atividade Pesqueira — Gestão de envios obrigatórios ao governo."
        actions={headerActions}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <DataTableSearch
          value={search.value}
          onChange={search.onChange}
          onOpenFilters={search.onOpenFilters}
          placeholder="Buscar por Nome ou CPF..."
        />

        <CardContent className="p-0">
          <DataTable<ReapWithMember>
            data={table.members}
            isLoading={table.isLoading}
            error={table.error as Error}
            onRetry={table.refetch}
            emptyMessage="Nenhum registro de REAP encontrado"
            emptyDescription="Ajuste seus filtros ou a busca para encontrar o que procura."
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
            entityName="registros"
          />
        </CardContent>
      </Card>

      <ReapFilterPanel {...filterPanel} />

      <ImportComprovantesDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <ConsultarPendenciasDialog open={isConsultarOpen} onOpenChange={setIsConsultarOpen} />

      <ManageReapDialog
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
    </div>
  );
}
