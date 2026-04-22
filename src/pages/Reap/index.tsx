import { Card, CardContent } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Send, FileUp, Search } from "lucide-react";
import { useState } from "react";
import { useReapListController } from "../../modules/reap/hooks/data/useReapData";
import { DataTable } from "@/shared/components/layout/DataTable";
import { ReapTablePagination } from "../../modules/reap/components/table/ReapTablePagination";
import { ReapFilterPanel } from "../../modules/reap/components/ReapFilterPanel";
import { BulkSendDialog } from "../../modules/reap/components/BulkSendDialog";
import { ImportComprovantesDialog } from "../../modules/reap/components/ImportComprovantesDialog";
import { ConsultarPendenciasDialog } from "../../modules/reap/components/ConsultarPendenciasDialog";
import { SearchBar } from "@/modules/members/components/search/SearchBar";
import { ReapStatusBadge } from "../../modules/reap/components/ReapStatusBadge";
import { ManageReapDialog } from "../../modules/reap/components/ManageReapDialog";
import { 
  ReapWithMember, 
  ANOS_SIMPLIFICADO, 
  ANO_INICIAL_ANUAL, 
  ANO_ATUAL 
} from "../../modules/reap/types/reap.types";
import { Badge } from "@/shared/components/ui/badge";
import { AlertTriangle, Settings2 } from "lucide-react";

/**
 * Calcula os anos obrigatórios de Simplificado para um sócio,
 * com base na data de emissão do RGP.
 */
function getAnosObrigatoriosSimplificado(emissaoRgp: string | null): number[] {
  if (!emissaoRgp) return [...ANOS_SIMPLIFICADO];
  const anoRgp = new Date(emissaoRgp).getFullYear();
  return ANOS_SIMPLIFICADO.filter((ano) => ano >= anoRgp);
}

/**
 * Calcula os anos obrigatórios de REAP Anual para um sócio.
 */
function getAnosObrigatoriosAnual(emissaoRgp: string | null): number[] {
  const anoInicio = emissaoRgp
    ? Math.max(new Date(emissaoRgp).getFullYear(), ANO_INICIAL_ANUAL)
    : ANO_INICIAL_ANUAL;
  const anos: number[] = [];
  for (let a = anoInicio; a <= ANO_ATUAL - 1; a++) {
    anos.push(a);
  }
  return anos;
}

export default function ReapPage() {
  const { search, table, pagination, filterPanel } = useReapListController();

  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConsultarOpen, setIsConsultarOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ReapWithMember | null>(null);

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
          <DataTable<ReapWithMember>
            data={table.members}
            isLoading={table.isLoading}
            error={table.error as Error}
            onRetry={table.refetch}
            emptyMessage="Nenhum registro de REAP encontrado"
            emptyDescription="Ajuste seus filtros ou a busca para encontrar o que procura."
            columns={[
              {
                header: "Sócio",
                className: "min-w-[200px]",
                cell: (m) => (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {m.member_nome ?? "—"}
                    </span>
                    {(Object.values(m.simplificado).some((a) => a.tem_problema) ||
                      Object.values(m.anual).some((a) => a.tem_problema)) && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                )
              },
              {
                header: "CPF",
                className: "text-sm text-muted-foreground font-mono whitespace-nowrap",
                cell: (m) => m.cpf
              },
              {
                header: "RGP",
                headerClassName: "text-center",
                className: "text-center",
                cell: (m) => !m.emissao_rgp ? (
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">Não informado</Badge>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-muted text-xs font-bold">
                    {new Date(m.emissao_rgp).getFullYear()}
                  </span>
                )
              },
              ...ANOS_SIMPLIFICADO.map((ano) => ({
                header: String(ano),
                headerClassName: "text-center",
                className: "text-center",
                cell: (m: ReapWithMember) => {
                  const obrigatorio = getAnosObrigatoriosSimplificado(m.emissao_rgp).includes(ano);
                  const anoData = m.simplificado[String(ano)];
                  if (!obrigatorio) return <span className="text-muted-foreground/30 text-xs">—</span>;
                  return (
                    <ReapStatusBadge
                      enviado={anoData?.enviado ?? false}
                      tem_problema={anoData?.tem_problema ?? false}
                      obs={anoData?.obs}
                      label={anoData?.enviado ? "OK" : "Pend."}
                    />
                  );
                }
              })),
              {
                header: "REAP 2025",
                headerClassName: "text-center",
                className: "text-center",
                cell: (m) => {
                  const anosAnualObrigatorios = getAnosObrigatoriosAnual(m.emissao_rgp);
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
                headerClassName: "text-right",
                className: "text-right px-6",
                cell: (m) => (
                  <Button
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(m);
                    }}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                )
              }
            ]}
          />

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
      
      <ManageReapDialog 
        member={selectedMember} 
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
    </div>
  );
}
