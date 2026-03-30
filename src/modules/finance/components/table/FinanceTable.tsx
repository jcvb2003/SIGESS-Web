import { Table } from "@/shared/components/ui/table";
import { FinanceTableHeader } from "./FinanceTableHeader";
import { FinanceTableBody } from "./FinanceTableBody";
import { FinanceTablePagination } from "./FinanceTablePagination";
import { TableEmptyState } from "./feedback/TableEmptyState";
import { TableLoadingState } from "./feedback/TableLoadingState";
import type { MemberFinancialSummary } from "../../types/finance.types";

interface FinanceTableProps {
  readonly members: MemberFinancialSummary[];
  readonly isLoading: boolean;
  readonly currentYear: number;
  readonly anoBase: number;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
  readonly onOpenStatement: (cpf: string) => void;
  readonly onOpenPayment: (cpf: string) => void;
  readonly onOpenDAE: (cpf: string) => void;
}

export function FinanceTable({
  members,
  isLoading,
  currentYear,
  anoBase,
  page,
  pageSize,
  total,
  onPageChange,
  onOpenStatement,
  onOpenPayment,
  onOpenDAE,
}: FinanceTableProps) {
  if (isLoading) {
    return (
      <Table>
        <FinanceTableHeader />
        <TableLoadingState colSpan={7} rows={pageSize} />
      </Table>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <FinanceTableHeader />
        {members.length === 0 ? (
          <TableEmptyState colSpan={7} message="Nenhum sócio encontrado para os filtros selecionados." />
        ) : (
          <FinanceTableBody
            members={members}
            currentYear={currentYear}
            anoBase={anoBase}
            onOpenStatement={onOpenStatement}
            onOpenPayment={onOpenPayment}
            onOpenDAE={onOpenDAE}
          />
        )}
      </Table>
      <FinanceTablePagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
