import type { MemberFinancialSummary } from "../../../types/finance.types";
import { FinancialStatusBadge } from "../../shared/FinancialStatusBadge";

interface FinancialStatusCellProps {
  readonly member: MemberFinancialSummary;
  readonly anoBase: number;
}

export function FinancialStatusCell({ member, anoBase }: FinancialStatusCellProps) {
  if (member.status === "overdue") {
    // Para mensalistas, não fazemos contagem de anos
    if (member.regime === "mensalidade") {
      return <FinancialStatusBadge status="overdue" detail="Débito mensal" />;
    }

    const currentYear = new Date().getFullYear();
    const paid = member.anuidadesPagas ?? [];
    const missing = [];

    // Contagem real baseada no ano de início da cobrança
    for (let y = currentYear; y >= anoBase; y--) {
      if (!paid.includes(y)) missing.push(y);
    }
    const yearsOverdue = missing.length;

    return (
      <FinancialStatusBadge
        status="overdue"
        detail={
          yearsOverdue > 1
            ? `${yearsOverdue} anos atraso`
            : yearsOverdue === 1 
              ? "1 ano atraso"
              : "Inadimplente"
        }
      />
    );
  }

  if (member.status === "released") {
    return <FinancialStatusBadge status="released" detail="Liberada (presidente)" />;
  }

  return <FinancialStatusBadge status={member.status} />;
}
