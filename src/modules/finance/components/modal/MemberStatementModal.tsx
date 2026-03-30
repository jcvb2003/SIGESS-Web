import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Printer, Pencil, Unlock, X, Settings2 } from "lucide-react";
import { useMemberStatement } from "../../hooks/data/useMemberStatement";
import { MemberFinancePreview } from "../shared/MemberFinancePreview";
import { AnnuitiesSection } from "./sections/AnnuitiesSection";
import { DAESection } from "./sections/DAESection";
import { OtherPaymentsSection } from "./sections/OtherPaymentsSection";
import { MemberFinanceConfigForm } from "../forms/MemberFinanceConfigForm";
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
  const [configMode, setConfigMode] = useState<"isencao" | "liberacao" | "regime" | null>(null);

  const anuidades = lancamentos.filter((l) => l.tipo === "anuidade" && l.status === "pago");
  const daeList = daes.filter((d) => d.status === "pago");
  const outros = lancamentos.filter(
    (l) => l.tipo !== "anuidade" && l.status === "pago",
  );



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl p-0 outline-none [&>button]:hidden overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Extrato Financeiro</DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500 font-medium tracking-tight">
                Histórico completo de lançamentos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all font-bold"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
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
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigMode(configMode === "isencao" ? null : "isencao")}
                  className="h-8 pr-3 pl-2.5 text-[11px] font-semibold gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                  <Pencil className="h-3 w-3" />
                  Isenção
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigMode(configMode === "regime" ? null : "regime")}
                  className="h-8 pr-3 pl-2.5 text-[11px] font-semibold gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-600 hover:text-white transition-all"
                >
                  <Settings2 className="h-3 w-3" />
                  Regime
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigMode(configMode === "liberacao" ? null : "liberacao")}
                  className="h-8 pr-3 pl-2.5 text-[11px] font-semibold gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                >
                  <Unlock className="h-3 w-3" />
                  Liberar
                </Button>
              </MemberFinancePreview>
            </div>

            {/* Config Panel (inline) */}
            {configMode && cpf && (
              <div className="mx-6">
                <MemberFinanceConfigForm
                  cpf={cpf}
                  mode={configMode}
                  onClose={() => setConfigMode(null)}
                />
              </div>
            )}

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

                  {anuidades.length === 0 &&
                    daeList.length === 0 &&
                    outros.length === 0 && (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <Printer className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                          Nenhum lançamento encontrado
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
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
