import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, RefreshCw, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ReportPageHeaderActions } from "@/modules/reports/components/ReportPageHeaderActions";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/shared/components/ui/sheet";
import { Card } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { DataTable, type ColumnDef } from "@/shared/components/layout/DataTable";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { useExternalChargesList } from "@/modules/finance/hooks/data/useExternalChargesList";
import type { ExternalChargeListItem } from "@/modules/finance/services/externalChargeService";

const PAGE_SIZE = 50;

const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  pendente:  "warning",
  paga:      "success",
  cancelada: "secondary",
  falha:     "destructive",
  expirada:  "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pendente:  "Pendente",
  paga:      "Paga",
  cancelada: "Cancelada",
  expirada:  "Expirada",
  falha:     "Falha",
};

const REISSUABLE = new Set(["falha", "expirada"]);

export default function ExternalChargesPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [billingTypeFilter, setBillingTypeFilter] = useState<string | null>(null);
  const [mesFilter, setMesFilter] = useState<number | null>(null);
  const [anoFilter, setAnoFilter] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = useMemo(() => ({
    status: statusFilter,
    billingType: billingTypeFilter,
    mes: mesFilter,
    ano: anoFilter,
    search,
    page,
    pageSize: PAGE_SIZE,
  }), [statusFilter, billingTypeFilter, mesFilter, anoFilter, search, page]);

  const { data, total, isLoading, isFetching, sync, isSyncing, syncingId, reissue, isReissuing, reissuingLancId } =
    useExternalChargesList(filters);

  const summary = useMemo(() => {
    const counts: Record<string, number> = { pendente: 0, paga: 0, falha: 0, expirada: 0, cancelada: 0 };
    for (const r of data) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [data]);

  const columns: ColumnDef<ExternalChargeListItem>[] = [
    {
      header: "Sócio",
      cell: (row) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate font-medium text-xs md:text-sm text-foreground/90 uppercase leading-none">
            {row.socio_nome ?? "—"}
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground truncate opacity-70 leading-none">
            {row.socio_cpf ?? "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Competência",
      cell: (row) =>
        row.competencia_mes != null && row.competencia_ano != null
          ? <span className="text-xs md:text-sm font-medium text-foreground/80 tabular-nums">
              {String(row.competencia_mes).padStart(2, "0")}/{row.competencia_ano}
            </span>
          : <span className="text-muted-foreground">—</span>,
    },
    {
      header: "Status FCX",
      cell: (row) => (
        <StatusBadge
          variant={STATUS_VARIANT[row.status] ?? "secondary"}
          label={STATUS_LABEL[row.status] ?? row.status}
        />
      ),
    },
    {
      header: "Status local",
      cell: (row) => row.lancamento_status
        ? <StatusBadge variant="secondary" label={row.lancamento_status} />
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      header: "Tipo",
      cell: (row) => row.billing_type
        ? <StatusBadge variant="info" label={row.billing_type} />
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      header: "Vencimento",
      cell: (row) => (
        <span className="text-xs md:text-sm font-medium text-foreground/80 tabular-nums">
          {row.data_vencimento ? formatDate(row.data_vencimento) : "—"}
        </span>
      ),
    },
    {
      header: "Valor",
      headerClassName: "text-right px-4",
      className: "text-right px-4",
      cell: (row) => (
        <span className="text-xs md:text-sm font-bold tabular-nums">
          {row.valor != null ? formatCurrency(row.valor) : "—"}
        </span>
      ),
    },
    {
      header: "Erro",
      cell: (row) => row.error_message ? (
        <span className="text-[10px] text-destructive truncate max-w-[120px] block" title={row.error_message}>
          {row.error_message}
        </span>
      ) : null,
    },
    {
      header: "Ações",
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.payment_url && row.status !== "paga" && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={row.payment_url} target="_blank" rel="noopener noreferrer" title="Abrir cobrança">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {row.status !== "paga" && row.status !== "cancelada" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => sync(row.id)}
              disabled={isSyncing && syncingId === row.id}
              title="Sincronizar"
            >
              {isSyncing && syncingId === row.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          )}
          {REISSUABLE.has(row.status) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-warning"
              onClick={() => {
                const dueDate = row.data_vencimento ?? new Date().toISOString().split("T")[0];
                reissue(row.lancamento_id, (row.billing_type as "BOLETO" | "PIX" | null) ?? "BOLETO", dueDate);
              }}
              disabled={isReissuing && reissuingLancId === row.lancamento_id}
              title="Reemitir"
            >
              {isReissuing && reissuingLancId === row.lancamento_id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RotateCcw className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const resetFilters = () => {
    setStatusFilter(null);
    setBillingTypeFilter(null);
    setMesFilter(null);
    setAnoFilter(null);
    setPage(1);
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cobranças Externas"
        description="Visão operacional global de cobranças via Asaas"
        actions={
          <ReportPageHeaderActions showExport={false} onBack={() => navigate("/finance")} />
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pendente", "paga", "falha", "expirada"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatusFilter(statusFilter === s ? null : s); setPage(1); }}
            className={`rounded-lg border p-3 text-left transition-colors ${statusFilter === s ? "border-primary bg-primary/5" : "border-border/50 bg-card hover:bg-primary/10"}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{STATUS_LABEL[s]}</p>
            <p className="text-xl font-black text-foreground">{summary[s] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-muted/5">
          <div className="flex-1">
            <DataTableSearch
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              onOpenFilters={() => setSheetOpen(true)}
              placeholder="Buscar por nome ou CPF..."
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          isFetching={isFetching}
          variant="minimal"
          skeletonCount={10}
          emptyMessage="Nenhuma cobrança externa encontrada."
          emptyDescription="Tente ajustar os filtros ou o termo de busca."
        />

        <DataTablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          entityName="cobranças"
          showNumbers
        />
      </Card>

      {/* Sheet de filtros avançados */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Refine a listagem por status, tipo e competência.</SheetDescription>
          </SheetHeader>

          <div className="mt-8 flex flex-col gap-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
              <Select value={statusFilter ?? "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Tipo de cobrança</span>
              <Select value={billingTypeFilter ?? "__all__"} onValueChange={(v) => setBillingTypeFilter(v === "__all__" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Competência</span>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mês</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="1–12"
                    value={mesFilter ?? ""}
                    onChange={(e) => setMesFilter(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Ano</Label>
                  <Input
                    type="number"
                    min={2020}
                    placeholder="2026"
                    value={anoFilter ?? ""}
                    onChange={(e) => setAnoFilter(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="mt-8 mb-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-11" onClick={resetFilters}>Limpar filtros</Button>
            <Button className="flex-1 h-11" onClick={() => setSheetOpen(false)}>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
