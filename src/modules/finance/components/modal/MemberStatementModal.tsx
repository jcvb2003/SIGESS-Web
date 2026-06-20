import { useState } from "react";
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
import { useExternalCharges } from "../../hooks/data/useExternalCharges";
import { MemberFinancePreview } from "../shared/MemberFinancePreview";
import { AnnuitiesSection } from "./sections/AnnuitiesSection";
import { DAESection } from "./sections/DAESection";
import { OtherPaymentsSection } from "./sections/OtherPaymentsSection";
import { CancelledPaymentsSection } from "./sections/CancelledPaymentsSection";
import { MensalidadesSection } from "./sections/MensalidadesSection";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { FinancialStatusType, FinanceDAE } from "../../types/finance.types";
import { SessionReceiptDialog } from "../dialogs/SessionReceiptDialog";
import { cn } from "@/shared/lib/utils";

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
  const { charges, sync, isSyncingId, reissue, isReissuingLancId } = useExternalCharges(
    open ? cpf : null,
  );

  const anuidades = lancamentos.filter((l) => l.tipo === "anuidade" && l.status === "pago");
  const daeList = daes.filter((d) => d.status === "pago");
  // Mensalidades: todos os statuses — MensalidadesSection agrupa por competência
  const mensalidades = lancamentos.filter((l) => l.tipo === "mensalidade");
  // Avulsos: tipos != mensalidade e != anuidade, apenas pagos
  const outrosNaoMensalidade = lancamentos.filter(
    (l) => l.tipo !== "anuidade" && l.tipo !== "mensalidade" && l.status === "pago",
  );
  // Cancelados de tipos não-mensalidade (cancelados de mensalidade ficam na MensalidadesSection)
  const canceladosNaoMensalidade = lancamentos.filter(
    (l) => l.tipo !== "mensalidade" && l.status === "cancelado",
  );

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const toggleSelection = (id: string, _type: 'lancamento' | 'dae', items?: FinanceDAE[]) => {
    if (items) {
      const allItemIds = items.map((i) => i.id);
      const isSelected = selectedIds.includes(id);
      
      if (isSelected) {
        setSelectedIds((prev) => prev.filter((p) => p !== id && !allItemIds.includes(p)));
      } else {
        setSelectedIds((prev) => [...prev, id, ...allItemIds]);
      }
    } else {
      setSelectedIds((prev) => 
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
    }
  };

  const handlePrintClick = () => {
    if (isSelectionMode) {
      if (selectedIds.length > 0) {
        setIsReceiptOpen(true);
      } else {
        setIsSelectionMode(false);
      }
    } else {
      setIsSelectionMode(true);
      setSelectedIds([]);
    }
  };

  let printButtonText = "Imprimir";
  if (isSelectionMode) {
    printButtonText = selectedIds.length > 0 ? "Gerar Comprovante" : "Cancelar Seleção";
  }

  const receiptLancamentos = lancamentos.filter((l) => selectedIds.includes(l.id));
  const receiptDaes = daes.filter((d) => selectedIds.includes(d.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl p-0 outline-none overflow-hidden [&>button]:hidden">
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
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
                  variant={isSelectionMode && selectedIds.length > 0 ? "default" : "outline"}
                  size="sm"
                  onClick={handlePrintClick}
                  className={cn(
                    "h-9 text-xs gap-1.5 font-bold px-4 transition-all",
                    isSelectionMode && selectedIds.length > 0
                      ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                      : "border-primary/20 dark:border-primary/20 text-primary hover:bg-primary dark:hover:bg-primary/90 hover:text-primary-foreground hover:border-primary"
                  )}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {printButtonText}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border-border transition-colors rounded-lg"
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                    onOpenChange(false);
                  }}
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
                    <AnnuitiesSection 
                      anuidades={anuidades} 
                      memberName={memberName} 
                      memberCpf={cpf ?? undefined} 
                      isSelectionMode={isSelectionMode}
                      selectedIds={selectedIds}
                      onToggleSelection={toggleSelection}
                    />
                    {daeList.length > 0 && (
                      <DAESection 
                        daes={daeList} 
                        memberName={memberName} 
                        memberCpf={cpf ?? undefined} 
                        isSelectionMode={isSelectionMode}
                        selectedIds={selectedIds}
                        onToggleSelection={toggleSelection}
                      />
                    )}
                    <MensalidadesSection
                      lancamentos={mensalidades}
                      charges={charges}
                      sync={sync}
                      isSyncingId={isSyncingId}
                      reissue={reissue}
                      isReissuingLancId={isReissuingLancId}
                    />

                    {outrosNaoMensalidade.length > 0 && (
                      <OtherPaymentsSection
                        lancamentos={outrosNaoMensalidade}
                        memberName={memberName}
                        memberCpf={cpf ?? undefined}
                        isSelectionMode={isSelectionMode}
                        selectedIds={selectedIds}
                        onToggleSelection={toggleSelection}
                      />
                    )}

                    <CancelledPaymentsSection lancamentos={canceladosNaoMensalidade} />

                    {anuidades.length === 0 &&
                      daeList.length === 0 &&
                      mensalidades.length === 0 &&
                      outrosNaoMensalidade.length === 0 &&
                      canceladosNaoMensalidade.length === 0 && (
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

      <SessionReceiptDialog
        open={isReceiptOpen}
        onOpenChange={(open) => {
          setIsReceiptOpen(open);
          if (!open) {
            setIsSelectionMode(false);
            setSelectedIds([]);
          }
        }}
        lancamentos={receiptLancamentos}
        daes={receiptDaes}
        memberName={memberName}
        memberCpf={cpf ?? undefined}
      />
    </Dialog>
  );
}
