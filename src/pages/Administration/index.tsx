import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Edit, Plus, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { administrationQueryKeys } from "@/modules/administration/queryKeys";
import {
  administrationService,
  type TenantUnitInput,
  type TenantUnitRecord,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
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
            Organize os polos do sindicato e prepare o acesso dos representantes.
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

export default function AdministrationPage() {
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TenantUnitRecord | null>(null);

  const unitsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUnits(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUnits();
      if (error) {
        throw error;
      }
      return data ?? [];
    },
    enabled: isAdmin,
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

  const units = unitsQuery.data ?? [];
  const activeUnitsCount = useMemo(
    () => units.filter((unit) => unit.isActive).length,
    [units],
  );

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Administração"
        description="Gerencie a estrutura do tenant e prepare os polos que os representantes vão operar."
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

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardDescription>Em operação no tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUnitsCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Escopo
            </CardTitle>
            <CardDescription>Primeira leva do admin do cliente</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cadastre polos e organize a estrutura base do sindicato antes de abrir acessos.
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
