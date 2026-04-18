import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { usePurgeFinanceActions } from "../../hooks/edit/usePurgeFinanceActions";

interface PurgePaymentDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly itemId: string | null;
  readonly itemDescription: string;
}

export function PurgePaymentDialog({
  open,
  onOpenChange,
  itemId,
  itemDescription,
}: PurgePaymentDialogProps) {
  const { purgePayment, isPurgingPayment } = usePurgeFinanceActions();

  const handleConfirm = async () => {
    if (!itemId) return;
    try {
      await purgePayment(itemId);
      onOpenChange(false);
    } catch {
      // O erro já é tratado no hook via toast
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Permanentemente?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs font-medium leading-relaxed">
            Você está prestes a realizar o expurgo (delete físico) do lançamento:
            {" "}
            <span className="block my-2 p-2 bg-muted rounded border font-bold text-foreground">
              {itemDescription}
            </span>
            {" "}
            Esta ação é **IRREVERSÍVEL**. O registro será removido definitivamente do banco de dados, 
            permanecendo apenas no log de auditoria técnica.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs font-bold uppercase tracking-tight">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold uppercase tracking-tight"
            disabled={isPurgingPayment}
          >
            {isPurgingPayment ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : null}
            Sim, Excluir Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
