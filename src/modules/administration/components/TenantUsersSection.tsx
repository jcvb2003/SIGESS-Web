import { Plus, Users } from "lucide-react";
import type { TenantUserRecord } from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";

interface TenantUsersSectionProps {
  readonly tenantUsers: TenantUserRecord[];
  readonly isLoading: boolean;
  readonly isToggling: boolean;
  readonly onCreate: () => void;
  readonly onToggle: (user: TenantUserRecord) => void;
}

export function TenantUsersSection({
  tenantUsers,
  isLoading,
  isToggling,
  onCreate,
  onToggle,
}: TenantUsersSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usuarios da entidade
          </CardTitle>
          <CardDescription>
            Apenas usuarios desta entidade podem receber acessos aos polos.
          </CardDescription>
        </div>
        <Button onClick={onCreate} variant="outline" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo usuario
        </Button>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-0 px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Operador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6 text-right">Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  Carregando usuarios...
                </TableCell>
              </TableRow>
            ) : tenantUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  Adicione operadores antes de vincular acessos aos polos.
                </TableCell>
              </TableRow>
            ) : (
              tenantUsers.filter((u) => u.tenantRole !== "owner").map((user) => (
                <TableRow key={user.id} className={!user.isActive ? "opacity-50" : undefined}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name || "Sem nome"}</span>
                      <span className="text-xs text-muted-foreground">{user.email || "Sem e-mail"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <StatusBadge variant="success" label="Ativo" />
                    ) : (
                      <StatusBadge variant="secondary" label="Inativo" />
                    )}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() => onToggle(user)}
                      disabled={isToggling}
                      aria-label={user.isActive ? "Desativar usuario" : "Ativar usuario"}
                    />
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
