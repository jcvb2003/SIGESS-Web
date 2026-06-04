import { useMemo, useState } from "react";
import { Building2, MoreVertical, Plus, Trash2, UserCog, UserPlus, X } from "lucide-react";
import type { MembershipRow, UnitStat } from "@/modules/administration/types";
import type {
  TenantMembershipInput,
  TenantMembershipRecord,
  TenantUnitRecord,
  TenantUserInput,
  TenantUserRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import { CardDescription, CardTitle } from "@/shared/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { SectionCard, SectionCardHeader } from "@/shared/components/ui/SectionCard";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
import { UnitCard } from "./UnitCard";

interface UnitsManagementSectionProps {
  readonly units: TenantUnitRecord[];
  readonly tenantUsers: TenantUserRecord[];
  readonly membershipRows: MembershipRow[];
  readonly memberships: TenantMembershipRecord[];
  readonly unitStats?: Record<string, UnitStat>;
  readonly isLoading: boolean;
  readonly isDeleting: boolean;
  readonly isSavingMembership: boolean;
  readonly isSavingUser: boolean;
  readonly isTogglingUser: boolean;
  readonly isDeletingUser: boolean;
  readonly onEdit: (unit: TenantUnitRecord) => void;
  readonly onEnter: (unit: TenantUnitRecord) => void;
  readonly onCreate: () => void;
  readonly onDeleteMembership: (membershipId: string) => void;
  readonly onCreateMembership: (input: TenantMembershipInput) => Promise<void>;
  readonly onCreateUser: (input: TenantUserInput) => Promise<void>;
  readonly onSetUserActive: (id: string, isActive: boolean) => void;
  readonly onDeleteUser: (id: string) => void;
}

export function UnitsManagementSection({
  units,
  tenantUsers,
  membershipRows,
  memberships,
  unitStats,
  isLoading,
  isDeleting,
  isSavingMembership,
  isSavingUser,
  isTogglingUser,
  isDeletingUser,
  onEdit,
  onEnter,
  onCreate,
  onDeleteMembership,
  onCreateMembership,
  onCreateUser,
  onSetUserActive,
  onDeleteUser,
}: UnitsManagementSectionProps) {
  const [newOperatorOpen, setNewOperatorOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);

  const rowsByUnit = useMemo(() => {
    const map = new Map<string, MembershipRow[]>();
    for (const row of membershipRows) {
      if (!row.membership.unitId) continue;
      if (row.user?.operatorType !== "presidente") continue;
      const existing = map.get(row.membership.unitId) ?? [];
      existing.push(row);
      map.set(row.membership.unitId, existing);
    }
    return map;
  }, [membershipRows]);

  // userId → list of {unit, membershipId} for badge rendering + delete
  const unitsByUser = useMemo(() => {
    const map = new Map<string, { unit: TenantUnitRecord; membershipId: string }[]>();
    for (const row of membershipRows) {
      if (!row.unit) continue;
      const existing = map.get(row.membership.userId) ?? [];
      existing.push({ unit: row.unit, membershipId: row.membership.id });
      map.set(row.membership.userId, existing);
    }
    return map;
  }, [membershipRows]);

  const operators = useMemo(
    () => tenantUsers.filter((u) => u.tenantRole !== "owner" && u.operatorType === "presidente"),
    [tenantUsers],
  );

  const activeUnits = useMemo(() => units.filter((u) => u.isActive), [units]);

  const pendingRow = pendingDeleteId
    ? (membershipRows.find((r) => r.membership.id === pendingDeleteId) ?? null)
    : null;

  return (
    <>
      <SectionCard>
        <SectionCardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Administração
            </CardTitle>
            <CardDescription>
              Operadores e configuração dos polos da entidade.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => setNewOperatorOpen(true)} variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo presidente
            </Button>
            <Button onClick={onCreate} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo polo
            </Button>
          </div>
        </SectionCardHeader>

        <Tabs defaultValue="operadores" className="px-6 pb-6">
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="operadores" className="text-xs gap-1.5">
              <UserCog className="h-3.5 w-3.5" />
              Operadores
            </TabsTrigger>
            <TabsTrigger value="polos" className="text-xs gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Polos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Operadores */}
          <TabsContent value="operadores" className="mt-0">
            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
            ) : operators.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum operador cadastrado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {operators.map((user) => {
                  const userUnits = unitsByUser.get(user.userId) ?? [];
                  const availableToLink = activeUnits.filter(
                    (u) => !memberships.some((m) => m.userId === user.userId && m.unitId === u.id),
                  );

                  return (
                    <div
                      key={user.id}
                      className={`flex gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        userUnits.length === 0
                          ? "border-amber-300/60 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-950/20"
                          : "border-border/50 bg-card"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                        {(user.name || user.email || "?")
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      {/* Info + polos */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Linha 1: nome + status + menu */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {user.name || user.email}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <StatusBadge
                              variant={user.isActive ? "success" : "secondary"}
                              label={user.isActive ? "Ativo" : "Inativo"}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground"
                                  disabled={isTogglingUser || isDeletingUser}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onSetUserActive(user.id, !user.isActive)}>
                                  {user.isActive ? "Desativar" : "Ativar"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={userUnits.length > 0}
                                  className={userUnits.length > 0 ? "opacity-50 cursor-not-allowed" : "text-destructive focus:text-destructive"}
                                  title={userUnits.length > 0 ? "Remova os vínculos antes de excluir" : undefined}
                                  onClick={() => { if (userUnits.length === 0) setPendingDeleteUserId(user.id); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Linha 2: email */}
                        {user.email && user.name && (
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        )}

                        {/* Linha 3: polos + vincular */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {userUnits.length === 0 ? (
                            <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                              Sem polo
                            </span>
                          ) : (
                            userUnits.map(({ unit, membershipId }) => (
                              <span
                                key={unit.id}
                                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                {unit.name}
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  className="rounded p-0.5 hover:text-destructive transition-colors disabled:opacity-50"
                                  aria-label={`Remover vínculo com ${unit.name}`}
                                  onClick={() => setPendingDeleteId(membershipId)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))
                          )}

                          {availableToLink.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
                                >
                                  <Plus className="h-3 w-3" />
                                  Vincular
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-48 p-1">
                                <p className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                  Vincular a polo
                                </p>
                                {availableToLink.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    disabled={isSavingMembership}
                                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50"
                                    onClick={() =>
                                      void onCreateMembership({
                                        userId: user.userId,
                                        unitId: u.id,
                                        isActive: true,
                                      })
                                    }
                                  >
                                    {u.name}
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Polos */}
          <TabsContent value="polos" className="mt-0">
            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando polos...</p>
            ) : units.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Comece criando o primeiro polo da entidade.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {units.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    rows={rowsByUnit.get(unit.id) ?? []}
                    stats={unitStats?.[unit.id]}
                    onEdit={() => onEdit(unit)}
                    onEnter={() => onEnter(unit)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      {/* Confirm remove membership */}
      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(o) => { if (!o) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRow
                ? `Remover ${pendingRow.user?.name || "este operador"} do polo ${pendingRow.unit?.name || "selecionado"}?`
                : "Confirma a remoção deste vínculo?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) {
                  onDeleteMembership(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete operator */}
      <AlertDialog
        open={Boolean(pendingDeleteUserId)}
        onOpenChange={(o) => { if (!o) setPendingDeleteUserId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir operador</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o acesso do operador a esta entidade. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteUserId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteUserId) {
                  onDeleteUser(pendingDeleteUserId);
                  setPendingDeleteUserId(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New operator dialog */}
      <NewOperatorDialog
        open={newOperatorOpen}
        onOpenChange={setNewOperatorOpen}
        existingEmails={tenantUsers.map((u) => u.email ?? "").filter(Boolean)}
        isSaving={isSavingUser}
        onSubmit={async (input) => {
          await onCreateUser(input);
          setNewOperatorOpen(false);
        }}
      />
    </>
  );
}

// ─── New Operator Dialog ─────────────────────────────────────────────────────

interface NewOperatorDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly existingEmails: string[];
  readonly isSaving: boolean;
  readonly onSubmit: (input: TenantUserInput) => Promise<void>;
}

function NewOperatorDialog({ open, onOpenChange, existingEmails, isSaving, onSubmit }: NewOperatorDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset() { setName(""); setEmail(""); setPassword(""); setSubmitError(null); }

  const emailExists = existingEmails.includes(email.trim().toLowerCase());
  const isValid = name.trim() && email.trim() && password.length >= 6 && !emailExists;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo presidente</DialogTitle>
          <DialogDescription>
            Crie um presidente e vincule-o a um polo pela aba Operadores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-op-name">Nome</Label>
            <Input id="new-op-name" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-op-email">E-mail</Label>
            <Input id="new-op-email" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} />
            {emailExists && <p className="text-xs text-destructive">Este e-mail já está cadastrado nesta entidade.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-op-senha">Senha</Label>
            <Input id="new-op-senha" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSaving} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          <Button
            type="button"
            disabled={isSaving || !isValid}
            onClick={async () => {
              setSubmitError(null);
              try {
                await onSubmit({
                  email: email.trim(),
                  name: name.trim(),
                  tenantRole: "member",
                  operatorType: "presidente",
                  mode: "create",
                  password,
                  autoConfirm: true,
                });
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err ?? "");
                if (msg.toLowerCase().includes("already")) {
                  setSubmitError("Este e-mail já está cadastrado no sistema.");
                } else {
                  setSubmitError(msg || "Erro ao criar operador.");
                }
              }
            }}
          >
            {isSaving ? "Criando..." : "Criar operador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
