import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";

interface CancelPaymentDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly itemId: string | null;
  readonly itemDescription?: string;
  readonly onConfirm: (observation: string) => Promise<void>;
  readonly isPending: boolean;
  readonly title?: string;
}

export function CancelPaymentDialog({
  open,
  onOpenChange,
  itemId,
  itemDescription,
  onConfirm,
  isPending,
  title = "Cancelar Registro",
}: CancelPaymentDialogProps) {
  const [observation, setObservation] = useState("");

  const handleConfirm = async () => {
    if (!itemId) return;
    await onConfirm(observation || "Cancelado pelo operador");
    onOpenChange(false);
    setObservation("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 outline-none [&>button]:hidden overflow-hidden max-w-sm transition-all duration-300">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0 text-left bg-red-50/30 dark:bg-red-950/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm border border-red-200/50 dark:border-red-800/50 transition-all duration-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {title}
                </DialogTitle>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Operação Irreversível
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border-border transition-colors rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {itemDescription && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-[11px] font-medium text-red-800 dark:text-red-300 leading-relaxed animate-in fade-in zoom-in-95 duration-500">
              {itemDescription}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground px-0.5">
              Motivo do cancelamento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Descreva o motivo do cancelamento obrigatório..."
              className="text-xs min-h-[100px] bg-muted/50 focus:bg-card transition-colors border-border focus:ring-red-500/30 focus:border-red-500 dark:focus:border-red-900"
            />
          </div>

          <div className="pt-4 flex items-center gap-3 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11"
            >
              Manter Registro
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !observation.trim()}
              onClick={handleConfirm}
              className="flex-[2] h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
