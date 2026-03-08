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
        <DialogHeader className="px-6 pt-6 pb-2 border-b flex-shrink-0 text-left bg-red-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100/50 text-red-600 shadow-sm border border-red-200/50">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {title}
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1 px-0.5">
            Esta ação registrará o cancelamento definitivo para auditoria.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {itemDescription && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[11px] font-medium text-red-800 leading-relaxed animate-in fade-in zoom-in-95 duration-500">
              {itemDescription}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-600 px-0.5">
              Motivo do cancelamento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Descreva o motivo do cancelamento obrigatório..."
              className="text-xs min-h-[100px] bg-slate-50/50 focus:bg-white transition-colors border-slate-200 focus:ring-red-500"
            />
          </div>

          <div className="pt-4 flex items-center gap-3 border-t border-slate-100">
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
