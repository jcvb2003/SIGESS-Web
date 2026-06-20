import { useState, useCallback, useMemo } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { cn } from "@/shared/lib/utils";
import { ChevronRight, Receipt, FileSpreadsheet, CreditCard } from "lucide-react";
import { useFinanceDashboard } from "@/modules/finance/hooks/data/useFinanceDashboard";
import { useFinanceSettings } from "@/modules/finance/hooks/data/useFinanceSettings";
import { useFinanceFilters } from "@/modules/finance/hooks/filters/useFinanceFilters";
import { useFinanceStats } from "@/modules/finance/hooks/data/useFinanceStats";
import { useFinanceTabCounts } from "@/modules/finance/hooks/data/useFinanceTabCounts";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { DataTable } from "@/shared/components/layout/DataTable";
import { MemberInfoCell } from "@/modules/finance/components/table/cells/MemberInfoCell";
import { FinancialStatusCell } from "@/modules/finance/components/table/cells/FinancialStatusCell";
import { AnnuitiesCell } from "@/modules/finance/components/table/cells/AnnuitiesCell";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { ClipboardList, FileText, Wallet } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import type { MemberFinancialSummary } from "@/modules/finance/types/finance.types";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { SummaryCards } from "@/modules/finance/components/shared/SummaryCards";
import { MemberStatementModal } from "@/modules/finance/components/modal/MemberStatementModal";
import { PaymentSessionDialog } from "@/modules/finance/components/dialogs/PaymentSessionDialog";
import { DAEDialog } from "@/modules/finance/components/dialogs/DAEDialog";
import { FinanceSettingsDialog } from "@/modules/finance/components/dialogs/FinanceSettingsDialog";
import { FinanceFilterPanel } from "@/modules/finance/components/filters/FinanceFilterPanel";
import { AuditLogDialog } from "@/modules/finance/components/dialogs/AuditLogDialog";
import { BatchChargeDialog } from "@/modules/finance/components/dialogs/BatchChargeDialog";
import { usePermissions } from "@/shared/hooks/usePermissions";
import type { FinanceDashboardParams } from "@/modules/finance/types/finance.types";
import { FinanceHeaderActions } from "@/modules/finance/components/shared/FinanceHeaderActions";

type ModalType = "statement" | "payment" | "dae";

const TABS: { value: FinanceDashboardParams["tab"]; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "em-dia", label: "Em dia" },
  { value: "inadimplentes", label: "Inadimplentes" },
  { value: "liberados", label: "Liberados" },
  { value: "isentos", label: "Isentos" },
];

const MONTH_NAMES = [
  "", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];


const NAV_LINKS = [
  { label: 'Pagamentos', icon: Receipt, path: '/finance/payments-report' },
  { label: 'DAEs', icon: FileSpreadsheet, path: '/finance/daes-report' },
  { label: 'Cobranças externas', icon: CreditCard, path: '/finance/external-charges' },
] as const;

export default function FinancePage() {
  const navigate = useNavigate();
  const { params, setSearch, setTab, setPage, setPageSize, applyAdvancedFilters, clearAdvancedFilters, hasActiveAdvancedFilters } = useFinanceFilters();
  const debouncedSearchTerm = useDebounce(params.searchTerm, 300);
  const { settings } = useFinanceSettings();
  const { isAdmin } = usePermissions();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const anoBase = settings?.ano_base_cobranca ?? 2024;

  const { members, total, isLoading } = useFinanceDashboard({ 
    ...params, 
    searchTerm: debouncedSearchTerm,
    anoBase 
  });

  // Real stats from DB
  const { arrecadado, arrecadadoAno, qtdPagamentos, daePendente } = useFinanceStats(currentYear, currentMonth);
  const { counts: tabCounts } = useFinanceTabCounts(debouncedSearchTerm, params.year, anoBase);

  // Modal unificado
  const [activeModal, setActiveModal] = useState<{ type: ModalType; cpf: string } | null>(null);
  const activeMember = useMemo(
    () => members.find((m) => m.cpf === activeModal?.cpf),
    [members, activeModal?.cpf]
  );

  // Diálogos independentes
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [batchChargeOpen, setBatchChargeOpen] = useState(false);

  const closeModal = useCallback(() => setActiveModal(null), []);
  const handleOpenStatement = useCallback((cpf: string) => setActiveModal({ type: "statement", cpf }), []);
  const handleOpenPayment = useCallback((cpf: string) => setActiveModal({ type: "payment", cpf }), []);
  const handleOpenDAE = useCallback((cpf: string) => setActiveModal({ type: "dae", cpf }), []);

  const columns = useMemo(() => [
    {
      header: "Sócio",
      className: "w-[30%] min-w-[200px]",
      cell: (m: MemberFinancialSummary) => <MemberInfoCell nome={m.nome} status={m.status} />
    },
    {
      header: "CPF",
      className: "whitespace-nowrap",
      cell: (m: MemberFinancialSummary) => <span className="text-sm font-medium text-muted-foreground">{m.cpf}</span>
    },
    {
      header: "Regime",
      className: "whitespace-nowrap capitalize hidden lg:table-cell",
      cell: (m: MemberFinancialSummary) => <span className="text-sm font-medium">{m.regime}</span>
    },
    {
      header: "Situação",
      className: "whitespace-nowrap",
      cell: (m: MemberFinancialSummary) => <FinancialStatusCell member={m} anoBase={anoBase} />
    },
    {
      header: "Último pag.",
      className: "whitespace-nowrap hidden md:table-cell",
      cell: (m: MemberFinancialSummary) => (
        <span className="text-sm font-medium text-muted-foreground">
          {m.ultimoPagamento ? formatDate(m.ultimoPagamento) : "—"}
        </span>
      )
    },
    {
      header: "Cobrança",
      cell: (m: MemberFinancialSummary) => (
        <AnnuitiesCell member={m} currentYear={currentYear} anoBase={anoBase} />
      )
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      className: "text-right w-[1%]",
      cell: (m: MemberFinancialSummary) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 active:scale-95 shadow-sm"
                  onClick={() => handleOpenStatement(m.cpf)}
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Extrato</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-all duration-200 shadow-sm",
                    !m.isento && "hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95",
                  )}
                  disabled={m.isento}
                  onClick={() => handleOpenPayment(m.cpf)}
                >
                  <Wallet className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Registrar Anuidades/Taxas</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-all duration-200 shadow-sm",
                    !m.isento && "hover:bg-amber-600 hover:text-white hover:border-amber-600 hover:scale-110 active:scale-95",
                  )}
                  disabled={m.isento}
                  onClick={() => handleOpenDAE(m.cpf)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Registrar DAE</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ], [anoBase, currentYear, handleOpenStatement, handleOpenPayment, handleOpenDAE]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-10">
      <PageHeader
        title="Financeiro"
        description="Gestão de anuidades, taxas e saúde financeira. Controle pagamentos e inadimplência de forma centralizada."
        actions={
          <FinanceHeaderActions
            isAdmin={isAdmin}
            hasActiveAdvancedFilters={Boolean(hasActiveAdvancedFilters)}
            onOpenFilters={() => setFiltersOpen(true)}



            onOpenAudit={() => setAuditOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenBatchCharge={() => setBatchChargeOpen(true)}
          />
        }
      />


      {/* Nav strip — relatórios e páginas relacionadas */}
      <div className="grid grid-cols-3 gap-3 -mt-4">
        {NAV_LINKS.map(({ label, icon: Icon, path }) => (
          <Card
            key={path}
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:bg-primary/10"
            onClick={() => navigate(path)}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <SummaryCards
        arrecadadoMes={arrecadado}
        arrecadadoAno={arrecadadoAno}
        qtdPagamentosMes={qtdPagamentos}
        mesLabel={`${MONTH_NAMES[currentMonth]}/${String(currentYear).slice(-2)}`}
        yearLabel={String(currentYear)}
        inadimplentes={tabCounts.inadimplentes}
        inadimplentes1Ano={0}
        daePendente={daePendente}
        isAdmin={isAdmin}
      />

      {/* Table Card */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b bg-muted/30 p-3">
          <DataTableSearch
            value={params.searchTerm}
            onChange={setSearch}
            contained={false}
          />
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 border-b bg-muted/20 px-3 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                params.tab === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
              onClick={() => setTab(tab.value)}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 inline-block rounded-full px-1.5 text-[10px]",
                  params.tab === tab.value
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground/70",
                )}
              >
                {tabCounts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Table Content */}
        <DataTable<MemberFinancialSummary>
          data={members}
          isLoading={isLoading}
          onRetry={() => window.location.reload()}
          emptyMessage="Nenhum sócio encontrado"
          emptyDescription="Tente ajustar seus filtros ou termos de busca para encontrar o que procura."
          columns={columns}
        />

        <DataTablePagination
          total={total}
          page={params.page}
          pageSize={params.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          showNumbers
          entityName="registros"
        />
      </Card>

      {/* Statement Modal */}
      <MemberStatementModal
        open={activeModal?.type === "statement"}
        onOpenChange={(open) => !open && closeModal()}
        cpf={activeModal?.type === "statement" ? activeModal.cpf : null}
        memberName={activeMember?.nome}
        memberStatus={activeMember?.status}
        memberRegime={activeMember?.regime}
      />

      {/* Payment Session Dialog (Entity) */}
      <PaymentSessionDialog
        open={activeModal?.type === "payment"}
        onOpenChange={(open) => !open && closeModal()}
        socioCpf={activeModal?.type === "payment" ? activeModal.cpf : null}
        socioName={activeMember?.nome}
        dataDeAdmissao={activeMember?.dataDeAdmissao}
        status={activeMember?.status}
        regime={activeMember?.regime}
      />

      {/* DAE Dialog (Repasse) */}
      <DAEDialog
        open={activeModal?.type === "dae"}
        onOpenChange={(open) => !open && closeModal()}
        socioCpf={activeModal?.type === "dae" ? activeModal.cpf : null}
        socioName={activeMember?.nome}
        status={activeMember?.status}
        regime={activeMember?.regime}
      />

      {/* Finance Settings Dialog */}
      <FinanceSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* Finance Filter Panel */}
      <FinanceFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        currentFilters={{
          filterAnnuityOk: params.filterAnnuityOk ?? false,
          filterAnnuityOverdue: params.filterAnnuityOverdue ?? false,
          filterDAEPaid: params.filterDAEPaid ?? false,
          filterDAEPending: params.filterDAEPending ?? false,
          filterContributionPending: params.filterContributionPending ?? false,
          filterGovRegistrationPending: params.filterGovRegistrationPending ?? false,
          filterReleased: params.filterReleased ?? false,
          filterExempt: params.filterExempt ?? false,
          year: params.year,
        }}
        onApply={applyAdvancedFilters}
        onClear={clearAdvancedFilters}
      />

      {/* Audit Log Dialog */}
      <AuditLogDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />

      <BatchChargeDialog
        open={batchChargeOpen}
        onOpenChange={setBatchChargeOpen}
      />
    </div>
  );
}


