import { TableCell, TableRow } from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { ClipboardList, FileText, Wallet } from "lucide-react";
import { MemberInfoCell } from "./cells/MemberInfoCell";
import { FinancialStatusCell } from "./cells/FinancialStatusCell";
import { AnnuitiesCell } from "./cells/AnnuitiesCell";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { MemberFinancialSummary } from "../../types/finance.types";
import { cn } from "@/shared/lib/utils";

interface FinanceTableRowProps {
  readonly member: MemberFinancialSummary;
  readonly currentYear: number;
  readonly anoBase: number;
  readonly onOpenStatement: (cpf: string) => void;
  readonly onOpenPayment: (cpf: string) => void;
  readonly onOpenDAE: (cpf: string) => void;
}

export function FinanceTableRow({
  member,
  currentYear,
  anoBase,
  onOpenStatement,
  onOpenPayment,
  onOpenDAE,
}: FinanceTableRowProps) {
  return (
    <TableRow className="group hover:bg-muted/50 transition-colors border-border/40">
      <TableCell className="py-4 px-4">
        <MemberInfoCell
          nome={member.nome}
          status={member.status}
        />
      </TableCell>
      <TableCell className="py-4 px-4">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {member.cpf}
        </span>
      </TableCell>
      <TableCell className="py-4 px-4">
        <span className="text-sm font-medium capitalize">
          {member.regime}
        </span>
      </TableCell>
      <TableCell className="py-4 px-4">
        <FinancialStatusCell member={member} anoBase={anoBase} />
      </TableCell>
      <TableCell className="py-4 px-4">
        <span className="text-sm font-medium text-muted-foreground">
          {member.ultimoPagamento
            ? formatDate(member.ultimoPagamento)
            : "—"}
        </span>
      </TableCell>
      <TableCell>
        <AnnuitiesCell
          member={member}
          currentYear={currentYear}
          anoBase={anoBase}
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 transition-all duration-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-110 active:scale-95 shadow-sm"
                  onClick={() => onOpenStatement(member.cpf)}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
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
                    "h-7 w-7 transition-all duration-200 shadow-sm",
                    !member.isento &&
                    "hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95",
                  )}
                  disabled={member.isento}
                  onClick={() => onOpenPayment(member.cpf)}
                >
                  <Wallet className="h-3.5 w-3.5" />
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
                    "h-7 w-7 transition-all duration-200 shadow-sm",
                    !member.isento &&
                    "hover:bg-amber-600 hover:text-white hover:border-amber-600 hover:scale-110 active:scale-95",
                  )}
                  disabled={member.isento}
                  onClick={() => onOpenDAE(member.cpf)}
                >
                  <FileText className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Registrar DAE</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}
