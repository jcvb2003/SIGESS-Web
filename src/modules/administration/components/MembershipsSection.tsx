import { Plus, Shield, Trash2 } from "lucide-react";
import type { TenantMembershipRecord, TenantUserRecord, TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

function getMembershipRoleLabel(role: TenantMembershipRecord["role"]) {
  return role === "unit_operator" ? "Operador" : role;
}

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
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Acessos aos polos
          </CardTitle>
          <CardDescription>
            Vincule gestores e operadores aos polos desta entidade.
          </CardDescription>
        </div>
        <Button onClick={onCreate} className="gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          Novo acesso
        </Button>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Polo</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Carregando acessos...
                </TableCell>
              </TableRow>
            ) : membershipRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum acesso configurado ainda.
                </TableCell>
              </TableRow>
            ) : (
              membershipRows.map(({ membership, user, unit }) => (
                <TableRow key={membership.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.name || "Sem nome"}</span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email || membership.userId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{unit?.name || "Sem polo"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getMembershipRoleLabel(membership.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={membership.isActive ? "default" : "secondary"}>
                      {membership.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isDeleting}
                      onClick={() => onDelete(membership.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
