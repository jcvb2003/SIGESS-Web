import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { Label } from "@/shared/components/ui/label";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { coordinatorService } from "@/modules/coordinators/services/coordinatorService";
import { coordinatorQueryKeys } from "@/modules/coordinators/queryKeys";
import { useCoordinatorsData } from "@/modules/coordinators/hooks/useCoordinatorsData";
import type { Coordinator } from "@/modules/coordinators/types/coordinator.types";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";

const emptyCoordinator: Coordinator = {
  id: "",
  name: "",
  region: "",
  phone: "",
  email: "",
  notes: "",
  isActive: true,
};

export default function CoordinatorsPage() {
  const { tenantId, unitId } = useActiveScope();
  const queryClient = useQueryClient();
  const { coordinators, isLoading } = useCoordinatorsData();
  const [editing, setEditing] = useState<Coordinator | null>(null);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<Coordinator | null>(null);
  const [form, setForm] = useState<Coordinator>(emptyCoordinator);

  const selectedCoordinator =
    coordinators.find((coordinator) => coordinator.id === selectedCoordinatorId) ?? null;

  const membersQuery = useQuery({
    queryKey: coordinatorQueryKeys.members(selectedCoordinatorId),
    queryFn: async () => {
      if (!selectedCoordinatorId) return [];
      const { data, error } = await coordinatorService.getCoordinatorMembers(selectedCoordinatorId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedCoordinatorId,
  });

  const coordinatorCountsQuery = useQuery({
    queryKey: ["coordinators", "counts", unitId ?? null, tenantId ?? null],
    queryFn: async () => {
      let query = supabase
        .from("socios")
        .select("coordinator_id")
        .not("coordinator_id", "is", null);

      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (unitId) query = query.eq("unit_id", unitId);

      const { data, error } = await query;
      if (error) throw error;

      const counts = new Map<string, number>();
      ((data ?? []) as Array<Record<string, unknown>>).forEach((row) => {
        if (typeof row.coordinator_id !== "string") return;
        counts.set(row.coordinator_id, (counts.get(row.coordinator_id) ?? 0) + 1);
      });

      return counts;
    },
    enabled: !!tenantId,
  });

  const countsByCoordinatorId = useMemo(() => {
    const counts = coordinatorCountsQuery.data ?? new Map<string, number>();
    if (selectedCoordinatorId) {
      counts.set(selectedCoordinatorId, membersQuery.data?.length ?? counts.get(selectedCoordinatorId) ?? 0);
    }
    return counts;
  }, [coordinatorCountsQuery.data, membersQuery.data, selectedCoordinatorId]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: coordinatorQueryKeys.list(unitId) });
    if (selectedCoordinatorId) {
      await queryClient.invalidateQueries({
        queryKey: coordinatorQueryKeys.members(selectedCoordinatorId),
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Tenant não resolvido.");
      if (!unitId) throw new Error("Unidade ativa n?o resolvida.");
      const resolvedUnitId = unitId;
      const { error } = await coordinatorService.saveCoordinator(form, {
        tenantId,
        unitId: resolvedUnitId,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing?.id ? "Coordenador atualizado." : "Coordenador criado.");
      handleDialogChange(false);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar coordenador.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await coordinatorService.deleteCoordinator(id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Coordenador excluído.");
      setSelectedCoordinatorId((current) =>
        current === coordinatorToDelete?.id ? null : current,
      );
      setCoordinatorToDelete(null);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir coordenador.");
    },
  });

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setEditing(null);
      setForm(emptyCoordinator);
    }
  };

  const openCreate = () => {
    setEditing(emptyCoordinator);
    setForm(emptyCoordinator);
  };

  const openEdit = (coordinator: Coordinator) => {
    setEditing(coordinator);
    setForm(coordinator);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Coordenadores"
        description="Organize responsáveis regionais e visualize os sócios vinculados a cada coordenador."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Equipe de coordenação
              </CardTitle>
              <CardDescription>
                Cadastre coordenadores e mantenha o vínculo operacional dos sócios.
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <div className="text-sm text-muted-foreground">Carregando coordenadores...</div>
            )}

            {!isLoading && coordinators.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Nenhum coordenador cadastrado ainda.
              </div>
            )}

            {coordinators.map((coordinator) => {
              const isSelected = coordinator.id === selectedCoordinatorId;
              const count = coordinator.id ? countsByCoordinatorId.get(coordinator.id) : undefined;

              return (
                <div
                  key={coordinator.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() =>
                        setSelectedCoordinatorId((current) =>
                          current === coordinator.id ? null : coordinator.id ?? null,
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{coordinator.name}</h3>
                        <Badge variant="secondary">{count ?? "—"} sócios</Badge>
                      </div>
                      {coordinator.region && (
                        <div className="mt-1 text-xs font-medium text-foreground/80">
                          {coordinator.region}
                        </div>
                      )}
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {coordinator.phone && <div>{coordinator.phone}</div>}
                        {coordinator.email && <div>{coordinator.email}</div>}
                      </div>
                      {coordinator.notes && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {coordinator.notes}
                        </p>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(coordinator)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCoordinatorToDelete(coordinator)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Sócios vinculados</CardTitle>
            <CardDescription>
              {selectedCoordinator
                ? `Lista atual do coordenador ${selectedCoordinator.name}.`
                : "Selecione um coordenador para visualizar os sócios associados."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedCoordinator && (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Nenhum coordenador selecionado.
              </div>
            )}

            {selectedCoordinator && membersQuery.isLoading && (
              <div className="text-sm text-muted-foreground">Carregando sócios...</div>
            )}

            {selectedCoordinator && !membersQuery.isLoading && (membersQuery.data?.length ?? 0) === 0 && (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Nenhum sócio vinculado a este coordenador.
              </div>
            )}

            {selectedCoordinator && (membersQuery.data?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {membersQuery.data?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{member.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.codigoDoSocio || "Sem código"} • {member.cpf || "Sem CPF"}
                      </div>
                    </div>
                    <Badge variant={member.situacao === "ATIVO" ? "default" : "secondary"}>
                      {member.situacao || "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar coordenador" : "Novo coordenador"}</DialogTitle>
            <DialogDescription>
              Defina o responsável regional que agrupa sócios desta entidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coordinator-name">Nome</Label>
              <Input
                id="coordinator-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinator-region">Localidade/Regiao</Label>
              <Input
                id="coordinator-region"
                value={form.region}
                onChange={(event) => setForm((current) => ({ ...current, region: event.target.value.toUpperCase() }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coordinator-phone">Telefone</Label>
                <Input
                  id="coordinator-phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coordinator-email">E-mail</Label>
                <Input
                  id="coordinator-email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinator-notes">Observações</Label>
              <Textarea
                id="coordinator-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name.trim()}
            >
              {editing?.id ? "Salvar alterações" : "Criar coordenador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!coordinatorToDelete}
        onOpenChange={(open) => {
          if (!open) setCoordinatorToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coordenador?</AlertDialogTitle>
            <AlertDialogDescription>
              {coordinatorToDelete
                ? `O coordenador ${coordinatorToDelete.name} ser? removido. S?cios vinculados ficar?o sem coordenador.`
                : "Confirme a exclus?o do coordenador."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (coordinatorToDelete?.id) {
                  deleteMutation.mutate(coordinatorToDelete.id);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
