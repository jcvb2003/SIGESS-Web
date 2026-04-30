import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Printer, X, FileText } from "lucide-react";
import { useMemberStatement } from "../../hooks/data/useMemberStatement";
import { MemberFinancePreview } from "../shared/MemberFinancePreview";
import { AnnuitiesSection } from "./sections/AnnuitiesSection";
import { DAESection } from "./sections/DAESection";
import { OtherPaymentsSection } from "./sections/OtherPaymentsSection";
import { CancelledPaymentsSection } from "./sections/CancelledPaymentsSection";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { FinancialStatusType } from "../../types/finance.types";

interface MemberStatementModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly cpf: string | null;
  readonly memberName?: string;
  readonly memberStatus?: FinancialStatusType;
  readonly memberRegime?: string;
}

export function MemberStatementModal({
  open,
  onOpenChange,
  cpf,
  memberName,
  memberStatus,
  memberRegime,
}: MemberStatementModalProps) {
  const { lancamentos, daes, isLoading } = useMemberStatement(
    open ? cpf : null,
  );

  const anuidades = lancamentos.filter((l) => l.tipo === "anuidade" && l.status === "pago");
  const daeList = daes.filter((d) => d.status === "pago");
  const outros = lancamentos.filter(
    (l) => l.tipo !== "anuidade" && l.status === "pago",
  );
  const cancelados = lancamentos.filter((l) => l.status === "cancelado");



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl p-0 outline-none overflow-hidden [&>button]:hidden">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">Extrato Financeiro</DialogTitle>
                  <p className="mt-0.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Histórico completo de lançamentos
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-900/50 hover:text-white dark:hover:text-emerald-400 hover:border-emerald-600 dark:hover:border-emerald-800/50 transition-all font-bold px-4"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border-border transition-colors rounded-lg"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 h-full max-h-[85vh]">
            <div className="py-6 border-none">
              {/* Member Header */}
              <div className="mx-6 mb-6">
                <MemberFinancePreview
                  name={memberName}
                  cpf={cpf ?? undefined}
                  status={memberStatus}
                  regime={memberRegime ?? "Anuidade"}
                />
              </div>

              {/* Content */}
              <div className="px-6 space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((id) => (
                      <Skeleton key={`stmt-skeleton-${id}`} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    <AnnuitiesSection anuidades={anuidades} />
                    {daeList.length > 0 && <DAESection daes={daeList} />}
                    {outros.length > 0 && <OtherPaymentsSection lancamentos={outros} />}

                    <CancelledPaymentsSection lancamentos={cancelados} />

                    {anuidades.length === 0 &&
                      daeList.length === 0 &&
                      outros.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Printer className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Nenhum lançamento encontrado
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Este sócio ainda não possui histórico financeiro
                          </p>
                        </div>
                      )}
                  </>
                )}


              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
