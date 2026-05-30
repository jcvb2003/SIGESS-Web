import { useState } from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import type { TenantMembershipRecord, TenantUserRecord, TenantUnitRecord } from "@/modules/administration/services/administrationService";
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
import { Button } from "@/shared/components/ui/button";
import { CardDescription, CardTitle } from "@/shared/components/ui/card";
import { SectionCard, SectionCardHeader, SectionCardTableContent } from "@/shared/components/ui/SectionCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";

interface MembershipsSectionProps {
  readonly membershipRows: Array<{
    membership: TenantMembershipRecord;
    user: TenantUserRecord | null;
    unit: TenantUnitRecord | null;
  }>;
  readonly isLoading: boolean;
  readonly isDeleting: boolean;
  readonly onCreate: () => void;
  readonly onDelete: (membershipId: string) => void;
}

export function MembershipsSection({
  membershipRows,
  isLoading,
  isDeleting,
  onCreate,
  onDelete,
}: MembershipsSectionProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingRow = pendingDeleteId
    ? membershipRows.find((r) => r.membership.id === pendingDeleteId)
    : null;

  return (
    <>
      <SectionCard>
        <SectionCardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Acessos aos polos
            </CardTitle>
            <CardDescription>
              Vincule operadores aos polos desta entidade.
            </CardDescription>
          </div>
          <Button onClick={onCreate} variant="outline" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Novo acesso
          </Button>
        </SectionCardHeader>
        <SectionCardTableContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Operador</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Carregando acessos...
                  </TableCell>
                </TableRow>
              ) : membershipRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Crie polos e operadores primeiro, depois vincule os acessos.
                  </TableCell>
                </TableRow>
              ) : (
                membershipRows.map(({ membership, user, unit }) => (
                  <TableRow
                    key={membership.id}
                    className={!membership.isActive ? "opacity-50" : undefined}
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.name || "Sem nome"}</span>
                        <span className="text-xs text-muted-foreground">
                          {user?.email || membership.userId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{unit?.name || "—"}</TableCell>
                    <TableCell>
                      {membership.isActive ? (
                        <StatusBadge variant="success" label="Ativo" />
                      ) : (
                        <StatusBadge variant="secondary" label="Inativo" />
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting}
                        onClick={() => setPendingDeleteId(membership.id)}
                        aria-label="Remover acesso"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCardTableContent>
      </SectionCard>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRow
                ? `Remover acesso de ${pendingRow.user?.name || "este operador"} ao polo ${pendingRow.unit?.name || "selecionado"}? Esta acao nao pode ser desfeita.`
                : "Confirma a remocao deste acesso?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) {
                  onDelete(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
