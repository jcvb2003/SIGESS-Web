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
import { Loader2 } from "lucide-react";
import { useBulkContributionLaunch } from "../../hooks/edit/useBulkContributionLaunch";

interface BulkContributionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly chargeTypeId: string;
  readonly chargeTypeName: string;
}

/**
 * Diálogo de confirmação para lançamento em massa de contribuições.
 * Segue o padrão do MemberDeleteDialog (AlertDialog para ações irreversíveis).
 */
export function BulkContributionDialog({
  open,
  onOpenChange,
  chargeTypeId,
  chargeTypeName,
}: BulkContributionDialogProps) {
  const bulkMutation = useBulkContributionLaunch();

  const handleConfirm = () => {
    bulkMutation.mutate(chargeTypeId, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lançamento em massa</AlertDialogTitle>
          <AlertDialogDescription>
            Isso criará pendências do tipo{" "}
            <strong className="text-foreground">{chargeTypeName}</strong> para
            todos os sócios ativos que ainda não possuem esta cobrança.
            <br />
            <br />
            Essa ação não pode ser desfeita facilmente. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={bulkMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={bulkMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {bulkMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Confirmar lançamento"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
