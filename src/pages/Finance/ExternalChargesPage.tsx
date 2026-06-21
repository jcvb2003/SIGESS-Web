import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, RefreshCw, RotateCcw, Loader2, History, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import { ReportPageHeaderActions } from "@/modules/reports/components/ReportPageHeaderActions";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/shared/components/ui/sheet";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { useExternalChargesList } from "@/modules/finance/hooks/data/useExternalChargesList";
import { useExternalChargesSummary } from "@/modules/finance/hooks/data/useExternalChargesSummary";
import type { ExternalChargeListItem } from "@/modules/finance/services/externalChargeService";

const PAGE_SIZE = 50;

const STATUS_PRIORITY: Record<string, number> = {
  paga: 0, pendente: 1, falha: 2, expirada: 3, cancelada: 4,
};

const STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  pendente: "warning", paga: "success", cancelada: "secondary",
  expirada: "destructive", falha: "destructive",
};

const LANC_STATUS_VARIANT: Record<string, StatusBadgeVariant> = {
  pago: "success", pendente: "warning", cancelado: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente", paga: "Paga", cancelada: "Cancelada",
  expirada: "Expirada", falha: "Falha",
};

const REISSUABLE = new Set(["falha", "expirada"]);

type GroupKey = string;
type FcxGroup = { key: GroupKey; primary: ExternalChargeListItem; history: ExternalChargeListItem[] };

function groupByCompetencia(rows: ExternalChargeListItem[]): FcxGroup[] {
  const map = new Map<GroupKey, ExternalChargeListItem[]>();
  for (const row of rows) {
    const key = `${row.socio_cpf ?? ""}|${row.competencia_ano ?? ""}|${row.competencia_mes ?? ""}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return [...map.entries()].map(([key, items]) => {
    const sorted = [...items].sort(
      (a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
    );
    return { key, primary: sorted[0], history: sorted.slice(1) };
  });
}

export default function ExternalChargesPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [billingTypeFilter, setBillingTypeFilter] = useState<string | null>(null);
  const [mesFilter, setMesFilter] = useState<number | null>(null);
  const [anoFilter, setAnoFilter] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [cancelFcxId, setCancelFcxId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    status: statusFilter, billingType: billingTypeFilter,
    mes: mesFilter, ano: anoFilter, search, page, pageSize: PAGE_SIZE,
  }), [statusFilter, billingTypeFilter, mesFilter, anoFilter, search, page]);

  const { data, total, isLoading, isFetching, sync, isSyncing, syncingId, reissue, isReissuing, reissuingLancId, cancelCharge, isCancelling, cancellingId } =
    useExternalChargesList(filters);

  const summaryFilters = useMemo(() => ({
    billingType: billingTypeFilter, mes: mesFilter, ano: anoFilter, search,
  }), [billingTypeFilter, mesFilter, anoFilter, search]);

  const summary = useExternalChargesSummary(summaryFilters);
  const groups = useMemo(() => groupByCompetencia(data), [data]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const renderActions = (row: ExternalChargeListItem) => (
    <div className="flex items-center gap-1">
      {row.payment_url && row.status !== "paga" && (
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a href={row.payment_url} target="_blank" rel="noopener noreferrer" title="Abrir cobrança">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      )}
      {(row.status !== "paga" && row.status !== "cancelada") ||
       (row.status === "paga" && row.lancamento_status !== "pago") ? (
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => sync(row.id)} disabled={isSyncing && syncingId === row.id} title="Sincronizar">
          {isSyncing && syncingId === row.id
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
      ) : null}
      {row.status === "pendente" && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
          onClick={() => setCancelFcxId(row.id)}
          disabled={isCancelling && cancellingId === row.id} title="Cancelar cobrança externa">
          {isCancelling && cancellingId === row.id
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <XCircle className="h-3.5 w-3.5" />}
        </Button>
      )}
      {REISSUABLE.has(row.status) && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-warning"
          onClick={() => {
            const dueDate = row.data_vencimento ?? new Date().toISOString().split("T")[0];
            reissue(row.lancamento_id, (row.billing_type as "BOLETO" | "PIX" | null) ?? "BOLETO", dueDate);
          }}
          disabled={isReissuing && reissuingLancId === row.lancamento_id} title="Reemitir">
          {isReissuing && reissuingLancId === row.lancamento_id
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RotateCcw className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );

  const resetFilters = () => {
    setStatusFilter(null); setBillingTypeFilter(null);
    setMesFilter(null); setAnoFilter(null); setPage(1); setSheetOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Cobranças Externas"
        description="Visão operacional global de cobranças via Asaas"
        actions={<ReportPageHeaderActions showExport={false} onBack={() => navigate("/finance")} />}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pendente", "paga", "falha", "expirada"] as const).map((s) => {
          const active = statusFilter === s;
          const colorMap: Record<string, { bg: string; border: string; text: string; activeBg: string; activeBorder: string }> = {
            pendente: { bg: "bg-warning/5",     border: "border-warning/20",     text: "text-warning",     activeBg: "bg-warning/10",     activeBorder: "border-warning/40" },
            paga:     { bg: "bg-success/5",     border: "border-success/20",     text: "text-success",     activeBg: "bg-success/10",     activeBorder: "border-success/40" },
            falha:    { bg: "bg-destructive/5", border: "border-destructive/20", text: "text-destructive", activeBg: "bg-destructive/10", activeBorder: "border-destructive/40" },
            expirada: { bg: "bg-destructive/5", border: "border-destructive/20", text: "text-destructive", activeBg: "bg-destructive/10", activeBorder: "border-destructive/40" },
          };
          const c = colorMap[s];
          return (
            <button key={s} type="button"
              onClick={() => { setStatusFilter(active ? null : s); setPage(1); }}
              className={`rounded-lg border p-3 text-left transition-all duration-200 hover:shadow-md ${active ? `${c.activeBg} ${c.activeBorder}` : `${c.bg} ${c.border} hover:${c.activeBg}`}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>{STATUS_LABEL[s]}</p>
              <p className={`text-xl font-black ${c.text}`}>{summary[s] ?? 0}</p>
            </button>
          );
        })}
      </div>

      {/* Tabela agrupada */}
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

        <div className={`overflow-x-auto ${isFetching ? "opacity-60 pointer-events-none" : ""}`}>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/40 bg-muted/20 hover:bg-muted/20">
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Sócio</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Comp.</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Status FCX</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Local</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Tipo</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hidden md:table-cell">Vencimento</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 text-right hidden sm:table-cell">Valor</TableHead>
                <TableHead className="h-11 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Erro</TableHead>
                <TableHead className="h-11 px-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/20">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-16 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Nenhuma cobrança externa encontrada.</p>
                    <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros ou o termo de busca.</p>
                  </TableCell>
                </TableRow>
              ) : (
                groups.map(({ key, primary, history }) => {
                  const expanded = expandedKeys.has(key);
                  const comp = primary.competencia_mes != null && primary.competencia_ano != null
                    ? `${String(primary.competencia_mes).padStart(2, "0")}/${primary.competencia_ano}`
                    : "—";

                  return (
                    <>
                      {/* Linha principal */}
                      <TableRow key={key} className="border-b border-border/20 hover:bg-muted/20">
                        <TableCell className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate font-medium text-xs md:text-sm text-foreground/90 uppercase leading-none">
                              {primary.socio_nome ?? "—"}
                            </span>
                            <span className="text-[10px] md:text-xs text-muted-foreground truncate opacity-70 leading-none">
                              {primary.socio_cpf ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-xs md:text-sm font-medium text-foreground/80 tabular-nums">{comp}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge variant={STATUS_VARIANT[primary.status] ?? "secondary"} label={STATUS_LABEL[primary.status] ?? primary.status} />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {primary.lancamento_status
                            ? <StatusBadge variant={LANC_STATUS_VARIANT[primary.lancamento_status] ?? "secondary"} label={primary.lancamento_status} />
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {primary.billing_type
                            ? <StatusBadge variant="info" label={primary.billing_type} />
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs md:text-sm font-medium text-foreground/80 tabular-nums">
                            {primary.data_vencimento ? formatDate(primary.data_vencimento) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className="text-xs md:text-sm font-semibold tabular-nums">
                            {primary.valor != null ? formatCurrency(primary.valor) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {primary.error_message ? (
                            <span className="text-[10px] text-destructive truncate max-w-[100px] block" title={primary.error_message}>
                              {primary.error_message}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {renderActions(primary)}
                            {history.length > 0 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                                onClick={() => toggleExpand(key)}
                                title={expanded ? "Ocultar anteriores" : `${history.length} cobrança(s) anterior(es)`}>
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Linhas históricas */}
                      {expanded && history.map((h) => (
                        <TableRow key={h.id} className="border-b border-dashed border-border/40 bg-muted/10 hover:bg-muted/10">
                          <TableCell className="px-4 py-2" />
                          <TableCell className="px-4 py-2">
                            <span className="text-xs text-muted-foreground tabular-nums">{comp}</span>
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <StatusBadge variant={STATUS_VARIANT[h.status] ?? "secondary"} label={STATUS_LABEL[h.status] ?? h.status} className="opacity-70" />
                          </TableCell>
                          <TableCell className="px-4 py-2" />
                          <TableCell className="px-4 py-2">
                            {h.billing_type
                              ? <span className="text-[10px] text-muted-foreground">{h.billing_type}</span>
                              : null}
                          </TableCell>
                          <TableCell className="px-4 py-2 hidden md:table-cell">
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {h.data_vencimento ? formatDate(h.data_vencimento) : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-2 hidden sm:table-cell" />
                          <TableCell className="px-4 py-2" />
                          <TableCell className="px-4 py-2" />
                        </TableRow>
                      ))}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          page={page} pageSize={PAGE_SIZE} total={total}
          onPageChange={setPage} entityName="cobranças" showNumbers
        />
      </Card>

      {/* Sheet de filtros avançados */}
      <AlertDialog open={!!cancelFcxId} onOpenChange={(open) => !open && setCancelFcxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cobrança externa?</AlertDialogTitle>
            <AlertDialogDescription>
              A cobrança será cancelada no Asaas e a competência ficará livre para registro de pagamento manual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => { if (cancelFcxId) { cancelCharge(cancelFcxId); setCancelFcxId(null); } }}
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <Input type="number" min={1} max={12} placeholder="1–12"
                    value={mesFilter ?? ""} onChange={(e) => setMesFilter(e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Ano</Label>
                  <Input type="number" min={2020} placeholder="2026"
                    value={anoFilter ?? ""} onChange={(e) => setAnoFilter(e.target.value ? Number(e.target.value) : null)} />
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
