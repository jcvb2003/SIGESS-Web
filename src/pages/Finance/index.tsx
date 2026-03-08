import { useState, useCallback } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Settings as SettingsIcon, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { cn } from "@/shared/lib/utils";
import { useFinanceDashboard } from "@/modules/finance/hooks/data/useFinanceDashboard";
import { useFinanceSettings } from "@/modules/finance/hooks/data/useFinanceSettings";
import { useFinanceFilters } from "@/modules/finance/hooks/filters/useFinanceFilters";
import { useFinanceStats } from "@/modules/finance/hooks/data/useFinanceStats";
import { useFinanceTabCounts } from "@/modules/finance/hooks/data/useFinanceTabCounts";
import { FinanceTable } from "@/modules/finance/components/table/FinanceTable";
import { FinanceSearchBar } from "@/modules/finance/components/search/FinanceSearchBar";
import { SummaryCards } from "@/modules/finance/components/shared/SummaryCards";
import { MemberStatementModal } from "@/modules/finance/components/modal/MemberStatementModal";
import { PaymentSessionDialog } from "@/modules/finance/components/dialogs/PaymentSessionDialog";
import { DAEDialog } from "@/modules/finance/components/dialogs/DAEDialog";
import { FinanceSettingsDialog } from "@/modules/finance/components/dialogs/FinanceSettingsDialog";
import { FinanceFilterPanel } from "@/modules/finance/components/filters/FinanceFilterPanel";
import type { FinanceDashboardParams } from "@/modules/finance/types/finance.types";

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

export default function FinancePage() {
  const { params, setSearch, setTab, setPage, setPageSize, applyAdvancedFilters, clearAdvancedFilters, hasActiveAdvancedFilters } = useFinanceFilters();
  const { settings } = useFinanceSettings();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const anoBase = settings?.ano_base_cobranca ?? 2024;

  const { members, total, isLoading } = useFinanceDashboard({ ...params, anoBase });

  // Real stats from DB
  const { arrecadado, arrecadadoAno, qtdPagamentos, daePendente } = useFinanceStats(currentYear, currentMonth);
  const { counts: tabCounts } = useFinanceTabCounts(params.searchTerm, params.year, anoBase);

  // Statement Modal
  const [statementCpf, setStatementCpf] = useState<string | null>(null);
  const statementMember = members.find((m) => m.cpf === statementCpf);

  // Payment Dialog (Entity)
  const [paymentCpf, setPaymentCpf] = useState<string | null>(null);
  const paymentMember = members.find((m) => m.cpf === paymentCpf);

  // DAE Dialog (Repasse)
  const [daeCpf, setDaeCpf] = useState<string | null>(null);
  const daeMember = members.find((m) => m.cpf === daeCpf);

  // Settings Dialog
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Filters Panel
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleOpenStatement = useCallback((cpf: string) => {
    setStatementCpf(cpf);
  }, []);

  const handleOpenPayment = useCallback((cpf: string) => {
    setPaymentCpf(cpf);
  }, []);

  const handleOpenDAE = useCallback((cpf: string) => {
    setDaeCpf(cpf);
  }, []);

  // tabCounts is now from useFinanceTabCounts (server-side, correct counts)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-10">
      <PageHeader
        title="Financeiro"
        description="Gestão de anuidades, taxas e saúde financeira. Controle pagamentos e inadimplência de forma centralizada."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 md:h-11 md:w-auto md:px-4 bg-background shrink-0 rounded-xl relative"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline text-xs font-bold uppercase transition-all">Filtros</span>
              {hasActiveAdvancedFilters && (
                <span className="absolute -top-1 -right-1 md:top-2 md:right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 md:h-11 md:w-auto md:px-4 bg-background shrink-0 rounded-xl"
              onClick={() => setSettingsOpen(true)}
            >
              <SettingsIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline text-xs font-bold uppercase transition-all">Configurar</span>
            </Button>
          </div>
        }
      />

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
      />

      {/* Table Card */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b bg-muted/30 p-3">
          <FinanceSearchBar
            value={params.searchTerm}
            onChange={setSearch}
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

        {/* Table */}
        <FinanceTable
          members={members}
          isLoading={isLoading}
          currentYear={currentYear}
          anoBase={anoBase}
          page={params.page}
          pageSize={params.pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onOpenStatement={handleOpenStatement}
          onOpenPayment={handleOpenPayment}
          onOpenDAE={handleOpenDAE}
        />
      </Card>

      {/* Statement Modal */}
      <MemberStatementModal
        open={!!statementCpf}
        onOpenChange={(open) => !open && setStatementCpf(null)}
        cpf={statementCpf}
        memberName={statementMember?.nome}
        memberStatus={statementMember?.status}
        memberRegime={statementMember?.regime}
      />

      {/* Payment Session Dialog (Entity) */}
      <PaymentSessionDialog
        open={paymentCpf !== null}
        onOpenChange={(open) => !open && setPaymentCpf(null)}
        socioCpf={paymentCpf}
        socioName={paymentMember?.nome}
        status={paymentMember?.status}
        regime={paymentMember?.regime}
      />

      {/* DAE Dialog (Repasse) */}
      <DAEDialog
        open={daeCpf !== null}
        onOpenChange={(open) => !open && setDaeCpf(null)}
        socioCpf={daeCpf}
        socioName={daeMember?.nome}
        status={daeMember?.status}
        regime={daeMember?.regime}
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
    </div>
  );
}

