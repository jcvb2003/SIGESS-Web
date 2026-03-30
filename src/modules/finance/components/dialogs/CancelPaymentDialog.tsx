import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Esta ação registrará o cancelamento para auditoria.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {itemDescription && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {itemDescription}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Motivo do cancelamento (Obrigatório)
            </Label>
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
              className="text-xs min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || !observation.trim()}
              onClick={handleConfirm}
              className="text-xs gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar cancelamento"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
