import { Users } from "lucide-react";
import type { TenantUserRecord } from "@/modules/administration/services/administrationService";
import { Badge } from "@/shared/components/ui/badge";
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

interface TenantUsersSectionProps {
  readonly tenantUsers: TenantUserRecord[];
  readonly isLoading: boolean;
}

export function TenantUsersSection({
  tenantUsers,
  isLoading,
}: TenantUsersSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Usuarios da entidade
        </CardTitle>
        <CardDescription>
          Apenas usuarios desta entidade podem receber acessos aos polos.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Papel na entidade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Carregando usuarios da entidade...
                </TableCell>
              </TableRow>
            ) : tenantUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Nenhum usuario vinculado a entidade ainda.
                </TableCell>
              </TableRow>
            ) : (
              tenantUsers.map((tenantUser) => (
                <TableRow key={tenantUser.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{tenantUser.name || "Sem nome"}</span>
                      <span className="text-xs text-muted-foreground">
                        {tenantUser.email || "Sem e-mail"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenantUser.tenantRole === "owner" ? "default" : "secondary"}>
                      {tenantUser.tenantRole === "owner"
                        ? "Gestor"
                        : tenantUser.tenantRole === "manager"
                          ? "Gestor de apoio"
                          : "Operador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenantUser.isActive ? "default" : "secondary"}>
                      {tenantUser.isActive ? "Ativo" : "Inativo"}
                    </Badge>
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
