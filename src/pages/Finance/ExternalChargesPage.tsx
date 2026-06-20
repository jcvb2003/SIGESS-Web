import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, RefreshCw, RotateCcw, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/shared/components/ui/sheet";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { DataTable, type ColumnDef } from "@/shared/components/layout/DataTable";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { useExternalChargesList } from "@/modules/finance/hooks/data/useExternalChargesList";
import type { ExternalChargeListItem } from "@/modules/finance/services/externalChargeService";

const PAGE_SIZE = 50;

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  cancelada: "Cancelada",
  expirada: "Expirada",
  falha: "Falha",
};

const STATUS_CLASS: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  paga: "bg-success/10 text-success border-success/20",
  cancelada: "bg-muted text-muted-foreground",
  expirada: "bg-destructive/10 text-destructive border-destructive/20",
  falha: "bg-destructive/10 text-destructive border-destructive/20",
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
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{row.socio_nome ?? "—"}</p>
          <p className="text-[10px] text-muted-foreground">{row.socio_cpf ?? "—"}</p>
        </div>
      ),
    },
    {
      header: "Competência",
      cell: (row) =>
        row.competencia_mes != null && row.competencia_ano != null
          ? `${String(row.competencia_mes).padStart(2, "0")}/${row.competencia_ano}`
          : "—",
    },
    {
      header: "Status FCX",
      cell: (row) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${STATUS_CLASS[row.status] ?? "bg-muted"}`}>
          {STATUS_LABEL[row.status] ?? row.status}
        </span>
      ),
    },
    {
      header: "Status local",
      cell: (row) => (
        <span className="text-[10px] text-muted-foreground">{row.lancamento_status ?? "—"}</span>
      ),
    },
    {
      header: "Tipo",
      cell: (row) => (
        <Badge variant="outline" className="text-[9px] font-bold uppercase">
          {row.billing_type ?? "—"}
        </Badge>
      ),
    },
    {
      header: "Vencimento",
      cell: (row) => <span className="text-xs">{row.data_vencimento ? formatDate(row.data_vencimento) : "—"}</span>,
    },
    {
      header: "Valor",
      cell: (row) => (
        <span className="text-xs font-semibold text-right block">
          {row.valor != null ? formatCurrency(row.valor) : "—"}
        </span>
      ),
    },
    {
      header: "Erro",
      cell: (row) =>
        row.error_message ? (
          <span className="text-[10px] text-destructive/80 truncate max-w-[120px] block" title={row.error_message}>
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
              className="h-7 w-7 text-amber-600"
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
    <div className="space-y-4 p-6">
      <PageHeader
        title="Cobranças Externas"
        description="Visão operacional global de cobranças via Asaas"
        leftAction={
          <Button variant="ghost" size="sm" onClick={() => navigate("/finance")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Financeiro
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pendente", "paga", "falha", "expirada"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(statusFilter === s ? null : s); setPage(1); }}
            className={`rounded-lg border p-3 text-left transition-colors ${statusFilter === s ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{STATUS_LABEL[s]}</p>
            <p className="text-xl font-black text-foreground">{summary[s] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <DataTableSearch
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nome ou CPF..."
        />
        <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)} className="gap-1.5 shrink-0">
          <SlidersHorizontal className="h-4 w-4" /> Filtros
        </Button>
      </div>

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading || isFetching}
        emptyMessage="Nenhuma cobrança externa encontrada."
      />

      <DataTablePagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      {/* Sheet de filtros avançados */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
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
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de cobrança</Label>
              <Select value={billingTypeFilter ?? "__all__"} onValueChange={(v) => setBillingTypeFilter(v === "__all__" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
          <SheetFooter>
            <Button variant="outline" className="w-full" onClick={resetFilters}>Limpar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
