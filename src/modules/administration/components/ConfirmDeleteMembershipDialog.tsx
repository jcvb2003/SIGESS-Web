import type { MembershipRow } from "@/modules/administration/types";
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

interface ConfirmDeleteMembershipDialogProps {
  readonly row: MembershipRow | null;
  readonly onConfirm: (membershipId: string) => void;
  readonly onCancel: () => void;
}

export function ConfirmDeleteMembershipDialog({
  row,
  onConfirm,
  onCancel,
}: ConfirmDeleteMembershipDialogProps) {
  return (
    <AlertDialog open={Boolean(row)} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover acesso</AlertDialogTitle>
          <AlertDialogDescription>
            {row
              ? `Remover acesso de ${row.user?.name || "este operador"} ao polo ${row.unit?.name || "selecionado"}?`
              : "Confirma a remoção deste acesso?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { if (row) onConfirm(row.membership.id); }}
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
