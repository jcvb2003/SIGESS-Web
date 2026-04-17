import { useForm, useWatch, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { DateField } from "@/shared/components/form-fields/fields/DateField";
import { usePaymentsByPeriod } from "@/modules/finance/hooks/data/usePaymentsByPeriod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/utils/formatters/currencyFormatters";
import { formatDate } from "@/shared/utils/date";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ReportExportButtons } from "@/modules/reports/components/ReportExportButtons";
import { Button } from "@/shared/components/ui/button";
import { FinanceTablePagination } from "@/modules/finance/components/table/FinanceTablePagination";
import type { PaymentByPeriod } from "@/modules/finance/types/finance.types";
import { useState } from "react";

interface FilterForm {
  startDate: string;
  endDate: string;
}

export default function PaymentsByPeriodPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const methods = useForm<FilterForm>({
    defaultValues: {
      startDate: `${new Date().getFullYear()}-01-01`,
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  const startDate = useWatch({ control: methods.control, name: "startDate" }) || "";
  const endDate = useWatch({ control: methods.control, name: "endDate" }) || "";

  const { data, isLoading, isFetching } = usePaymentsByPeriod(startDate, endDate, page, pageSize);
  
  const payments = data?.data ?? [];
  const totalAmount = data?.totalAmount ?? 0;
  const totalCount = data?.total ?? 0;

  const renderCompetencia = (payment: PaymentByPeriod) => {
    if (payment.tipo === "anuidade") {
      return payment.competencia_ano;
    }
    if (payment.tipo === "mensalidade") {
      const mes = String(payment.competencia_mes).padStart(2, "0");
      return `${mes}/${payment.competencia_ano}`;
    }
    return "—";
  };

  const handleExportExcel = () => {
    // Implementação futura ou via lib
    console.log("Exportar Excel");
  };

  const handleExportPdf = () => {
    globalThis.print();
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Carregando pagamentos...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (payments.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
            Nenhum pagamento encontrado para este período.
          </TableCell>
        </TableRow>
      );
    }

    return payments.map((payment) => (
      <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
        <TableCell className="font-medium">
          {formatDate(payment.data_pagamento)}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{payment.nome}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              {payment.cpf}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize text-[10px] font-bold">
            {payment.tipo.replaceAll("_", " ")}
          </Badge>
        </TableCell>
        <TableCell className="text-sm font-medium">
          {renderCompetencia(payment)}
        </TableCell>
        <TableCell className="text-sm capitalize">
          {payment.forma_pagamento}
        </TableCell>
        <TableCell className="text-right font-bold text-primary">
          {formatCurrency(payment.valor)}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 pb-10 print:p-0">
        <PageHeader
          title="Pagamentos por Período"
          description="Liste todos os pagamentos recebidos em um período selecionado."
          actions={
            <div className="flex items-center gap-3 print:hidden">
              {totalCount > 0 && (
                <ReportExportButtons 
                  onExportExcel={handleExportExcel}
                  onExportPdf={handleExportPdf}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="rounded-xl h-10 px-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          }
        />

        <Card className="p-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <DateField
              control={methods.control}
              name="startDate"
              label="Data Início"
              onChange={() => setPage(1)}
            />
            <DateField
              control={methods.control}
              name="endDate"
              label="Data Fim"
              onChange={() => setPage(1)}
            />
          </div>
        </Card>

        {startDate && endDate ? (
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="bg-primary/5 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Resultados de {formatDate(startDate)} até {formatDate(endDate)}
                </h3>
              </div>
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead>Sócio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableBody()}
                </TableBody>
              </Table>
            </div>

            <FinanceTablePagination
              total={totalCount}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />

            <div className="bg-primary/[0.03] border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground font-medium">
                Total de pagamentos: <span className="text-foreground font-bold">{totalCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Arrecadado</span>
                <div className="text-2xl font-black text-primary">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl bg-muted/20 text-muted-foreground gap-3">
            <p className="text-sm font-medium">Selecione um intervalo de datas para visualizar os pagamentos.</p>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
