import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ClipboardList, FileSearch, FileText, Wallet } from "lucide-react";
import { MemberInfoCell } from "./cells/MemberInfoCell";
import { FinancialStatusCell } from "./cells/FinancialStatusCell";
import { AnnuitiesCell } from "./cells/AnnuitiesCell";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import type { MemberFinancialSummary } from "../../types/finance.types";
import { cn } from "@/shared/lib/utils";

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
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((id) => (
          <Skeleton key={`fin-row-skeleton-${id}`} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileSearch className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Nenhum sócio encontrado
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Tente alterar os filtros ou a busca
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto">
              Sócio
            </TableHead>
            <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
              CPF
            </TableHead>
            <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
              Regime
            </TableHead>
            <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
              Situação
            </TableHead>
            <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
              Último pag.
            </TableHead>
            <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
              Anuidades
            </TableHead>
            <TableHead className="text-right text-sm font-semibold text-muted-foreground py-4 px-4 h-auto w-[1%] whitespace-nowrap">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.cpf} className="group hover:bg-muted/50 transition-colors border-border/40">
              <TableCell className="py-4 px-4">
                <MemberInfoCell
                  nome={member.nome}
                  status={member.status}
                />
              </TableCell>
              <TableCell className="py-4 px-4">
                <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                  {member.cpf}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4">
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {member.regime}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4">
                <FinancialStatusCell member={member} anoBase={anoBase} />
              </TableCell>
              <TableCell className="py-4 px-4">
                <span className="text-sm font-medium text-slate-600">
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
                <div className="flex justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 hover:border-emerald-500 hover:text-emerald-600"
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
                            "h-7 w-7",
                            !member.isento &&
                              "hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
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
                            "h-7 w-7",
                            !member.isento &&
                              "hover:bg-amber-600 hover:text-white hover:border-amber-600",
                          )}
                          disabled={member.isento}
                          onClick={() => onOpenDAE(member.cpf)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Registrar DAE (Repasse)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <span className="text-xs text-muted-foreground">
          Mostrando {members.length} de {total} sócios
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ← Anterior
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 w-8 text-xs",
                  pageNum === page && "bg-emerald-600 hover:bg-emerald-700",
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima →
          </Button>
        </div>
      </div>
    </>
  );
}

