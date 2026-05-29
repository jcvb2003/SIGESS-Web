import { useForm, useWatch, FormProvider } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { DateField } from "@/shared/components/form-fields/fields/DateField";
import { usePaymentsByPeriod } from "@/modules/finance/hooks/data/usePaymentsByPeriod";
import { DataTable, ColumnDef } from "@/shared/components/layout/DataTable";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/date";
import { Calendar, History } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import type { PaymentByPeriod } from "@/modules/finance/types/finance.types";
import { useState, useMemo, useEffect, useCallback } from "react";
import { DataTableSearch } from "@/shared/components/layout/DataTableSearch";
import { financeService } from "@/modules/finance/services/financeService";
import { reportsService } from "@/modules/reports/services/reportsService";
import { toast } from "sonner";


import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/shared/components/ui/sheet";


import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { ReportPageHeaderActions } from "@/modules/reports/components/ReportPageHeaderActions";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

interface FilterForm {
  startDate: string;
  endDate: string;
  searchTerm: string;
}

const PAYMENT_ORDER_FIELDS = ["data_pagamento", "created_at"] as const;
type PaymentOrderField = (typeof PAYMENT_ORDER_FIELDS)[number];

function parsePaymentOrderField(value: string | null): PaymentOrderField {
  return PAYMENT_ORDER_FIELDS.includes(value as PaymentOrderField)
    ? (value as PaymentOrderField)
    : "data_pagamento";
}

export default function PaymentsByPeriodPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;
  
  // Estados de controle local
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize")) || 20);
  const [orderBy, setOrderBy] = useState<PaymentOrderField>(
    parsePaymentOrderField(searchParams.get("orderBy")),
  );

  const methods = useForm<FilterForm>({
    defaultValues: {
      startDate: searchParams.get("startDate") || `${new Date().getFullYear()}-01-01`,
      endDate: searchParams.get("endDate") || new Date().toISOString().split("T")[0],
      searchTerm: searchParams.get("search") || "",
    },
  });

  const startDate = useWatch({ control: methods.control, name: "startDate" });
  const endDate = useWatch({ control: methods.control, name: "endDate" });
  const searchTerm = useWatch({ control: methods.control, name: "searchTerm" });

  // Sincronização com a URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (searchTerm) params.set("search", searchTerm);
    else params.delete("search");
    
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("orderBy", orderBy);

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [startDate, endDate, searchTerm, page, pageSize, orderBy, searchParams, setSearchParams]);

  const { data, isLoading, isFetching } = usePaymentsByPeriod(startDate, endDate, page, pageSize, orderBy);
  
  const payments = useMemo(() => {
    const list = data?.data ?? [];
    if (!searchTerm) return list;
    
    const term = searchTerm.toLowerCase();
    return list.filter(p => 
      p.nome?.toLowerCase().includes(term) || 
      p.cpf?.includes(term) ||
      p.tipo?.toLowerCase().includes(term)
    );
  }, [data?.data, searchTerm]);

  const totalCount = data?.total ?? 0;

  const renderCompetencia = useCallback((payment: PaymentByPeriod) => {
    if (payment.tipo === "anuidade") {
      return payment.competencia_ano;
    }
    if (payment.tipo === "mensalidade") {
      const mes = String(payment.competencia_mes).padStart(2, "0");
      return `${mes}/${payment.competencia_ano}`;
    }
    return "—";
  }, []);

  const columns = useMemo<ColumnDef<PaymentByPeriod>[]>(() => [
    {
      header: "Data Pag.",
      cell: (p) => (
        <span className="text-xs md:text-sm font-medium text-foreground/80 tabular-nums">
          {formatDate(p.data_pagamento)}
        </span>
      ),
      className: "w-[120px]"
    },
    {
      header: "Sócio",
      cell: (p) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate font-medium text-xs md:text-sm text-foreground/90 uppercase leading-none">
            {p.nome}
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground truncate opacity-70 leading-none">
            {p.cpf}
          </span>
        </div>
      )
    },
    {
      header: "Tipo",
      cell: (p) => (
        <StatusBadge 
          variant="info" 
          label={p.tipo.replaceAll("_", " ").toUpperCase()} 
        />
      ),
      className: "w-[140px]"
    },
    {
      header: "Competência",
      cell: (p) => (
        <span className="text-xs md:text-sm font-medium text-foreground/70">
          {renderCompetencia(p)}
        </span>
      ),
      className: "w-[120px]"
    },
    {
      header: "Forma",
      cell: (p) => (
        <span className="text-xs md:text-sm text-muted-foreground capitalize">
          {p.forma_pagamento}
        </span>
      ),
      className: "w-[120px]"
    },
    {
      header: "Valor",
      headerClassName: "text-right px-4",
      className: "text-right px-4",
      cell: (p) => (
        <span className="text-xs md:text-sm font-bold text-emerald-600 tabular-nums">
          {formatCurrency(p.valor)}
        </span>
      )
    }
  ], [renderCompetencia]);

  const renderContent = () => (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      {/* Toolbar / Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-muted/5">
        <div className="flex-1">
          <DataTableSearch
            value={searchTerm}
            onChange={(val) => methods.setValue("searchTerm", val)}
            onOpenFilters={() => setIsFiltersOpen(true)}
            placeholder="Filtrar por nome, CPF ou tipo..."
          />
        </div>
        
        <div className="flex items-center gap-1 p-3 border-t sm:border-t-0 sm:border-l bg-muted/5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2 px-2 hidden lg:inline">
            Ordenar por:
          </span>
          <Button
            variant={orderBy === "data_pagamento" ? "default" : "ghost"}
            size="sm"
            onClick={() => setOrderBy("data_pagamento")}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-tight"
          >
            <Calendar className="h-3 w-3 mr-1.5" />
            Pagamento
          </Button>
          <Button
            variant={orderBy === "created_at" ? "default" : "ghost"}
            size="sm"
            onClick={() => setOrderBy("created_at")}
            className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-tight"
          >
            <History className="h-3 w-3 mr-1.5" />
            Registro
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        isLoading={isLoading}
        isFetching={isFetching}
        variant="minimal"
        skeletonCount={10}
        emptyMessage="Nenhum pagamento encontrado"
        emptyDescription="Tente ajustar o período ou o termo de busca."
      />

      <DataTablePagination
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(val) => {
          setPageSize(Number(val));
          setPage(1);
        }}
        entityName="pagamentos"
        showNumbers
      />


    </Card>
  );

  const handleExportExcel = async () => {
    const toastId = toast.loading("Gerando exportação Excel...");
    try {
      const allData = await financeService.fetchAllPayments(startDate, endDate, orderBy, unitId);
      if (!allData.length) { toast.dismiss(toastId); toast.error("Sem dados para exportar."); return; }
      await reportsService.exportPaymentsToExcel(allData);
      toast.dismiss(toastId);
      toast.success("Excel exportado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Erro ao exportar Excel.");
    }
  };

  const handleExportPdf = async () => {
    const toastId = toast.loading("Gerando PDF...");
    try {
      const allData = await financeService.fetchAllPayments(startDate, endDate, orderBy, unitId);
      if (!allData.length) { toast.dismiss(toastId); toast.error("Sem dados para exportar."); return; }
      await reportsService.exportPaymentsToPdf(allData);
      toast.dismiss(toastId);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Erro ao gerar PDF.");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10 print:p-0">
        <PageHeader
          title="Pagamentos por Período"
          description="Relatório detalhado de entradas financeiras identificadas no sistema."
          actions={
            <ReportPageHeaderActions
              showExport={totalCount > 0}
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              onBack={() => navigate(-1)}
            />
          }
        />

        {renderContent()}

        {/* Painel Lateral de Filtros (Padrão SIGESS) */}
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros de relatórios</SheetTitle>
              <SheetDescription>
                Refine a listagem de pagamentos por período e outros critérios.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-8 flex flex-col gap-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Período de Referência
                </span>
                <div className="grid gap-4">
                  <DateField
                    control={methods.control}
                    name="startDate"
                    label="Data Inicial"
                  />
                  <DateField
                    control={methods.control}
                    name="endDate"
                    label="Data Final"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="mt-8 mb-6 flex flex-col sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11"
                onClick={() => {
                  methods.reset({
                    startDate: `${new Date().getFullYear()}-01-01`,
                    endDate: new Date().toISOString().split("T")[0],
                    searchTerm: ""
                  });
                }}
              >
                Limpar filtros
              </Button>
              <Button 
                type="button"
                className="flex-1 h-11"
                onClick={() => {
                  setPage(1);
                  setIsFiltersOpen(false);
                }}
              >
                Aplicar filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </FormProvider>
  );
}
