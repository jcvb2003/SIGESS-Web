import { useMemo, useState } from "react";
import { Building2, Plus, UserCog, UserPlus, X } from "lucide-react";
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
  readonly onEdit: (unit: TenantUnitRecord) => void;
  readonly onEnter: (unit: TenantUnitRecord) => void;
  readonly onCreate: () => void;
  readonly onDeleteMembership: (membershipId: string) => void;
  readonly onCreateMembership: (input: TenantMembershipInput) => Promise<void>;
  readonly onCreateUser: (input: TenantUserInput) => Promise<void>;
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
  onEdit,
  onEnter,
  onCreate,
  onDeleteMembership,
  onCreateMembership,
  onCreateUser,
}: UnitsManagementSectionProps) {
  const [newOperatorOpen, setNewOperatorOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const rowsByUnit = useMemo(() => {
    const map = new Map<string, MembershipRow[]>();
    for (const row of membershipRows) {
      if (!row.membership.unitId) continue;
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
    () => tenantUsers.filter((u) => u.tenantRole !== "owner"),
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
              Novo operador
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
              <div className="space-y-2">
                {operators.map((user) => {
                  const userUnits = unitsByUser.get(user.userId) ?? [];
                  const availableToLink = activeUnits.filter(
                    (u) => !memberships.some((m) => m.userId === user.userId && m.unitId === u.id),
                  );

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                        userUnits.length === 0
                          ? "border-amber-300/60 bg-amber-50/40 dark:border-amber-700/40 dark:bg-amber-950/20"
                          : "border-border/50 bg-card"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {(user.name || user.email || "?")
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {user.name || user.email}
                        </p>
                        {user.email && user.name && (
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        )}
                      </div>

                      {/* Polo badges + vincular */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {userUnits.length === 0 ? (
                          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            Sem polo
                          </span>
                        ) : (
                          userUnits.map(({ unit, membershipId }) => (
                            <span
                              key={unit.id}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary pl-2 pr-1 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {unit.name}
                              <button
                                type="button"
                                disabled={isDeleting}
                                className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                                aria-label={`Remover vínculo com ${unit.name}`}
                                onClick={() => setPendingDeleteId(membershipId)}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))
                        )}

                        {availableToLink.length > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                aria-label="Vincular a polo"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-48 p-1">
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
                                      role: "unit_operator",
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

                      <StatusBadge
                        variant={user.isActive ? "success" : "secondary"}
                        label={user.isActive ? "Ativo" : "Inativo"}
                      />
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

  function reset() { setName(""); setEmail(""); setPassword(""); }

  const emailExists = existingEmails.includes(email.trim().toLowerCase());
  const isValid = name.trim() && email.trim() && password.length >= 6 && !emailExists;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo operador</DialogTitle>
          <DialogDescription>
            Crie um usuário operador. Vincule-o a um polo pela aba Operadores.
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
            {emailExists && <p className="text-xs text-destructive">Este e-mail já está cadastrado.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-op-senha">Senha</Label>
            <Input id="new-op-senha" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSaving} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button
            type="button"
            disabled={isSaving || !isValid}
            onClick={() => void onSubmit({ email: email.trim(), name: name.trim(), tenantRole: "member", mode: "create", password, autoConfirm: true })}
          >
            {isSaving ? "Criando..." : "Criar operador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
