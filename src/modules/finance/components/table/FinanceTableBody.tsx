import { TableBody } from "@/shared/components/ui/table";
import { FinanceTableRow } from "./FinanceTableRow";
import type { MemberFinancialSummary } from "../../types/finance.types";

interface FinanceTableBodyProps {
  readonly members: MemberFinancialSummary[];
  readonly currentYear: number;
  readonly anoBase: number;
  readonly onOpenStatement: (cpf: string) => void;
  readonly onOpenPayment: (cpf: string) => void;
  readonly onOpenDAE: (cpf: string) => void;
}

export function FinanceTableBody({
  members,
  currentYear,
  anoBase,
  onOpenStatement,
  onOpenPayment,
  onOpenDAE,
}: FinanceTableBodyProps) {
  return (
    <TableBody>
      {members.map((member) => (
        <FinanceTableRow
          key={member.cpf}
          member={member}
          currentYear={currentYear}
          anoBase={anoBase}
          onOpenStatement={onOpenStatement}
          onOpenPayment={onOpenPayment}
          onOpenDAE={onOpenDAE}
        />
      ))}
    </TableBody>
  );
}
