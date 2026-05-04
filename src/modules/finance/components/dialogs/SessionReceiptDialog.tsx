import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Printer, X, FileText } from "lucide-react";
import type { FinanceLancamento, FinanceDAE } from "../../types/finance.types";
import { PrintLayout } from "@/shared/components/print/PrintLayout";
import { usePrint } from "@/shared/hooks/usePrint";

import { FinanceReceiptContent } from "../shared/FinanceReceiptContent";

interface SessionReceiptDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly lancamentos: FinanceLancamento[];
  readonly daes?: FinanceDAE[];
  readonly memberName?: string;
  readonly memberCpf?: string;
}

export function SessionReceiptDialog({
  open,
  onOpenChange,
  lancamentos,
  daes = [],
  memberName,
  memberCpf,
}: SessionReceiptDialogProps) {
  const { print } = usePrint();

  const handlePrint = useCallback(() => {
    print("receipt-content", { rotated: true });
  }, [print]);

  if (lancamentos.length === 0 && daes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] p-0 outline-none [&>button]:hidden overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-4 pt-6 pb-2 border-b flex-shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary mb-1">
              <FileText className="h-5 w-5" />
              <DialogTitle className="text-xl font-bold tracking-tight">
                Comprovante
              </DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-2 font-bold border-border hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-border transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1 px-0.5">
            Documento de validação de pagamento de sessão
          </p>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden scrollbar-hide bg-muted/10">
          <PrintLayout
            id="receipt-content"
            type="thermal"
            className="text-xs"
          >
            <FinanceReceiptContent
              lancamentos={lancamentos}
              daes={daes}
              memberName={memberName}
              memberCpf={memberCpf}
            />
          </PrintLayout>
        </div>
      </DialogContent>
    </Dialog>
  );
}
