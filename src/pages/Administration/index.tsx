import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Edit, Plus, Shield, ToggleLeft, ToggleRight, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { administrationQueryKeys } from "@/modules/administration/queryKeys";
import {
  administrationService,
  type TenantMembershipInput,
  type TenantMembershipRecord,
  type TenantUnitInput,
  type TenantUnitRecord,
  type TenantUserRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Switch } from "@/shared/components/ui/switch";

function UnitDialog({
  open,
  onOpenChange,
  editingUnit,
  onSubmit,
  isSaving,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUnit: TenantUnitRecord | null;
  onSubmit: (values: TenantUnitInput) => Promise<void>;
  isSaving: boolean;
}>) {
  const [name, setName] = useState(editingUnit?.name ?? "");
  const [code, setCode] = useState(editingUnit?.code ?? "");
  const [city, setCity] = useState(editingUnit?.city ?? "");
  const [state, setState] = useState(editingUnit?.state ?? "");

  const isEditing = Boolean(editingUnit?.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setName("");
          setCode("");
          setCity("");
          setState("");
        } else {
          setName(editingUnit?.name ?? "");
          setCode(editingUnit?.code ?? "");
          setCity(editingUnit?.city ?? "");
          setState(editingUnit?.state ?? "");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar polo" : "Novo polo"}</DialogTitle>
          <DialogDescription>
            Organize os polos do sindicato e prepare o acesso dos operadores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="unit-name" className="text-sm font-medium">
              Nome do polo
            </label>
            <Input
              id="unit-name"
              placeholder="Polo Oeiras"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="unit-code" className="text-sm font-medium">
                Código
              </label>
              <Input
                id="unit-code"
                placeholder="oeiras"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="unit-state" className="text-sm font-medium">
                UF
              </label>
              <Input
                id="unit-state"
                placeholder="PI"
                maxLength={2}
                value={state}
                onChange={(event) => setState(event.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="unit-city" className="text-sm font-medium">
              Cidade
            </label>
            <Input
              id="unit-city"
              placeholder="Oeiras"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || !name.trim()}
            onClick={() =>
              void onSubmit({
                id: editingUnit?.id,
                name,
                code,
                city,
                state,
                isActive: editingUnit?.isActive ?? true,
              })
            }
          >
            {isEditing ? "Salvar alterações" : "Criar polo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getMembershipRoleLabel(role: TenantMembershipRecord["role"]) {
  switch (role) {
    case "tenant_admin":
      return "Gestor";
    case "unit_manager":
      return "Gestor do polo";
    case "unit_operator":
      return "Operador";
    case "unit_viewer":
      return "Leitura";
    default:
      return role;
  }
}

function MembershipDialog({
  open,
  onOpenChange,
  users,
  units,
  onSubmit,
  isSaving,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: TenantUserRecord[];
  units: TenantUnitRecord[];
  onSubmit: (values: TenantMembershipInput) => Promise<void>;
  isSaving: boolean;
}>) {
  const [userId, setUserId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [role, setRole] = useState<TenantMembershipInput["role"]>("unit_manager");
  const [isDefault, setIsDefault] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setUserId("");
          setUnitId("");
          setRole("unit_manager");
          setIsDefault(false);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo acesso</DialogTitle>
          <DialogDescription>
            Vincule um usuario do sindicato a um polo deste mesmo sindicato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membership-user">Usuario</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="membership-user">
                <SelectValue placeholder="Selecione um usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.name || user.email || user.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-unit">Polo</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger id="membership-unit">
                <SelectValue placeholder="Selecione um polo" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-role">Papel</Label>
            <Select value={role} onValueChange={(value) => setRole(value as TenantMembershipInput["role"])}>
              <SelectTrigger id="membership-role">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant_admin">Gestor</SelectItem>
                <SelectItem value="unit_manager">Gestor do polo</SelectItem>
                <SelectItem value="unit_operator">Operador</SelectItem>
                <SelectItem value="unit_viewer">Leitura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
            <Checkbox
              id="membership-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(Boolean(checked))}
            />
            <Label htmlFor="membership-default" className="cursor-pointer">
              Definir como polo padrao deste usuario
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || !userId || !unitId}
            onClick={() =>
              void onSubmit({
                userId,
                unitId,
                role,
                isActive: true,
                isDefault,
              })
            }
          >
            Criar acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdministrationPage() {
  const { canAccessTenantAdministration, isTenantAdministrationLoading } = usePermissions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TenantUnitRecord | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);

  const unitsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUnits(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUnits();
      if (error) {
        throw error;
      }
      return data ?? [];
    },
    enabled: canAccessTenantAdministration,
  });

  const tenantUsersQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUsers(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUsers();
      if (error) {
        throw error;
      }
      return data ?? [];
    },
    enabled: canAccessTenantAdministration,
  });

  const membershipsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantMemberships(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantMemberships();
      if (error) {
        throw error;
      }
      return data ?? [];
    },
    enabled: canAccessTenantAdministration,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TenantUnitInput) => {
      const { data, error } = await administrationService.saveTenantUnit(values);
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantUnits(),
      });
      toast.success("Polo salvo com sucesso.");
      setDialogOpen(false);
      setEditingUnit(null);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar o polo.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (unit: TenantUnitRecord) => {
      const { error } = await administrationService.setTenantUnitActive(
        unit.id,
        !unit.isActive,
      );
      if (error) {
        throw error;
      }
    },
    onSuccess: async (_, unit) => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantUnits(),
      });
      toast.success(
        unit.isActive ? "Polo desativado com sucesso." : "Polo ativado com sucesso.",
      );
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar o polo.",
      );
    },
  });

  const membershipCreateMutation = useMutation({
    mutationFn: async (values: TenantMembershipInput) => {
      const { data, error } = await administrationService.createTenantMembership(values);
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantMemberships(),
      });
      toast.success("Acesso criado com sucesso.");
      setMembershipDialogOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel criar o acesso.",
      );
    },
  });

  const membershipDeleteMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await administrationService.deleteTenantMembership(membershipId);
      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantMemberships(),
      });
      toast.success("Acesso removido com sucesso.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel remover o acesso.",
      );
    },
  });

  const units = unitsQuery.data ?? [];
  const tenantUsers = tenantUsersQuery.data ?? [];
  const memberships = membershipsQuery.data ?? [];
  const activeUnitsCount = useMemo(
    () => units.filter((unit) => unit.isActive).length,
    [units],
  );
  const activeUsersCount = useMemo(
    () => tenantUsers.filter((user) => user.isActive).length,
    [tenantUsers],
  );
  const ownerUsersCount = useMemo(
    () => tenantUsers.filter((user) => user.tenantRole === "owner").length,
    [tenantUsers],
  );
  const membershipsCount = useMemo(
    () => memberships.filter((membership) => membership.isActive).length,
    [memberships],
  );

  const membershipRows = useMemo(() => {
    const userMap = new Map(tenantUsers.map((user) => [user.userId, user]));
    const unitMap = new Map(units.map((unit) => [unit.id, unit]));

    return memberships.map((membership) => ({
      membership,
      user: userMap.get(membership.userId) ?? null,
      unit: membership.unitId ? (unitMap.get(membership.unitId) ?? null) : null,
    }));
  }, [memberships, tenantUsers, units]);

  if (isTenantAdministrationLoading) {
    return null;
  }

  if (!canAccessTenantAdministration) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Portal do Gestor"
        description="Gerencie polos, acessos e a estrutura estadual antes da operacao dos polos."
        actions={
          <Button
            onClick={() => {
              setEditingUnit(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo polo
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Polos
            </CardTitle>
            <CardDescription>Total cadastrado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{units.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ToggleRight className="h-5 w-5 text-emerald-600" />
              Polos ativos
            </CardTitle>
            <CardDescription>Em operacao no sindicato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUnitsCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuarios do sindicato
            </CardTitle>
            <CardDescription>Universo interno permitido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUsersCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Responsaveis
            </CardTitle>
            <CardDescription>Gestores do sindicato</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="text-3xl font-bold text-foreground">{ownerUsersCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Acessos ativos
            </CardTitle>
            <CardDescription>Vinculos entre usuarios e polos</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="text-3xl font-bold text-foreground">{membershipsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usuarios do sindicato
          </CardTitle>
          <CardDescription>
            Apenas usuarios deste sindicato podem receber acessos aos polos.
          </CardDescription>
        </CardHeader>
        <CardContent className="border-t border-border/10 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Papel no sindicato</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantUsersQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Carregando usuarios do sindicato...
                  </TableCell>
                </TableRow>
              ) : tenantUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Nenhum usuario vinculado ao sindicato ainda.
                  </TableCell>
                </TableRow>
              ) : (
                tenantUsers.map((tenantUser: TenantUserRecord) => (
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Acessos aos polos
            </CardTitle>
            <CardDescription>
              Vincule gestores e operadores aos polos deste sindicato.
            </CardDescription>
          </div>
          <Button
            onClick={() => setMembershipDialogOpen(true)}
            className="gap-2"
            variant="outline"
          >
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
              {membershipsQuery.isLoading ? (
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
                      <Badge variant={membership.role === "tenant_admin" ? "default" : "secondary"}>
                        {getMembershipRoleLabel(membership.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={membership.isActive ? "default" : "secondary"}>
                          {membership.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        {membership.isDefault ? (
                          <span className="text-xs text-muted-foreground">Padrão</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={membershipDeleteMutation.isPending}
                        onClick={() => membershipDeleteMutation.mutate(membership.id)}
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

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Polos
          </CardTitle>
          <CardDescription>
            Crie, ajuste e ative os polos municipais do tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="border-t border-border/10 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Polo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Carregando polos...
                  </TableCell>
                </TableRow>
              ) : units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum polo cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.code || "—"}</TableCell>
                    <TableCell>
                      {unit.city ? `${unit.city}${unit.state ? `/${unit.state}` : ""}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.isActive ? "default" : "secondary"}>
                        {unit.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={unit.isActive}
                            onCheckedChange={() => toggleMutation.mutate(unit)}
                            disabled={toggleMutation.isPending}
                          />
                          {unit.isActive ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingUnit(unit);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UnitDialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen);
          if (!nextOpen) {
            setEditingUnit(null);
          }
        }}
        editingUnit={editingUnit}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
        isSaving={saveMutation.isPending}
      />

      <MembershipDialog
        open={membershipDialogOpen}
        onOpenChange={setMembershipDialogOpen}
        users={tenantUsers.filter((user) => user.isActive)}
        units={units.filter((unit) => unit.isActive)}
        onSubmit={async (values) => {
          await membershipCreateMutation.mutateAsync(values);
        }}
        isSaving={membershipCreateMutation.isPending}
      />
    </div>
  );
}
