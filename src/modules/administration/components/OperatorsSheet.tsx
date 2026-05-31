import { useState } from "react";
import { Link2, Trash2, UserCog, UserPlus } from "lucide-react";
import type { MembershipRow } from "@/modules/administration/types";
import type {
  TenantMembershipInput,
  TenantMembershipRecord,
  TenantUnitRecord,
  TenantUserInput,
  TenantUserRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
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

interface OperatorsSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly unit: TenantUnitRecord;
  readonly rows: MembershipRow[];
  readonly tenantUsers: TenantUserRecord[];
  readonly existingMemberships: TenantMembershipRecord[];
  readonly isDeleting: boolean;
  readonly isSavingMembership: boolean;
  readonly isSavingUser: boolean;
  readonly onDeleteMembership: (id: string) => void;
  readonly onCreateMembership: (input: TenantMembershipInput) => Promise<void>;
  readonly onCreateUser: (input: TenantUserInput) => Promise<void>;
}

type CadastroMode = "idle" | "vincular" | "criar";

export function OperatorsSheet({
  open,
  onOpenChange,
  unit,
  rows,
  tenantUsers,
  existingMemberships,
  isDeleting,
  isSavingMembership,
  isSavingUser,
  onDeleteMembership,
  onCreateMembership,
  onCreateUser,
}: OperatorsSheetProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [cadastroMode, setCadastroMode] = useState<CadastroMode>("idle");

  const pendingRow = pendingDeleteId
    ? (rows.find((r) => r.membership.id === pendingDeleteId) ?? null)
    : null;

  function handleClose() {
    setPendingDeleteId(null);
    setCadastroMode("idle");
    onOpenChange(false);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <SheetTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Operadores
            </SheetTitle>
            <SheetDescription>
              {unit.name} · {unit.code || "sem código"}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="vinculados" className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-6 mt-4 mb-0 w-auto justify-start rounded-lg h-9">
              <TabsTrigger value="vinculados" className="text-xs">
                Vinculados {rows.length > 0 && `(${rows.length})`}
              </TabsTrigger>
              <TabsTrigger value="cadastro" className="text-xs">
                Cadastro
              </TabsTrigger>
            </TabsList>

            {/* Tab: Vinculados */}
            <TabsContent value="vinculados" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <UserCog className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhum operador vinculado a este polo.</p>
                  <p className="text-xs text-muted-foreground">Use a aba Cadastro para vincular ou criar um operador.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rows.map(({ membership, user }) => (
                    <div
                      key={membership.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 ${!membership.isActive ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {(user?.name || user?.email || "?")
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user?.name || user?.email || membership.userId}
                          </p>
                          {user?.email && user.name && (
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={isDeleting}
                        onClick={() => setPendingDeleteId(membership.id)}
                        aria-label="Remover acesso"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Cadastro */}
            <TabsContent value="cadastro" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
              {cadastroMode === "idle" && (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setCadastroMode("vincular")}
                    className="flex items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Link2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Vincular operador existente</p>
                      <p className="text-xs text-muted-foreground">Associar um usuário já cadastrado na entidade a este polo</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCadastroMode("criar")}
                    className="flex items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Criar novo operador</p>
                      <p className="text-xs text-muted-foreground">Cadastrar um novo usuário e já associá-lo a este polo</p>
                    </div>
                  </button>
                </div>
              )}

              {cadastroMode === "vincular" && (
                <VincularForm
                  unitId={unit.id}
                  tenantUsers={tenantUsers}
                  existingMemberships={existingMemberships}
                  isSaving={isSavingMembership}
                  onSubmit={async (input) => {
                    await onCreateMembership(input);
                    setCadastroMode("idle");
                  }}
                  onCancel={() => setCadastroMode("idle")}
                />
              )}

              {cadastroMode === "criar" && (
                <CriarOperadorForm
                  existingEmails={tenantUsers.map((u) => u.email ?? "").filter(Boolean)}
                  isSaving={isSavingUser}
                  onSubmit={async (input) => {
                    await onCreateUser(input);
                    setCadastroMode("idle");
                  }}
                  onCancel={() => setCadastroMode("idle")}
                />
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(o) => { if (!o) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRow
                ? `Remover acesso de ${pendingRow.user?.name || "este operador"} ao polo ${unit.name}?`
                : "Confirma a remoção deste acesso?"}
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
    </>
  );
}

// ─── Vincular Form ──────────────────────────────────────────────────────────

interface VincularFormProps {
  readonly unitId: string;
  readonly tenantUsers: TenantUserRecord[];
  readonly existingMemberships: TenantMembershipRecord[];
  readonly isSaving: boolean;
  readonly onSubmit: (input: TenantMembershipInput) => Promise<void>;
  readonly onCancel: () => void;
}

function VincularForm({ unitId, tenantUsers, existingMemberships, isSaving, onSubmit, onCancel }: VincularFormProps) {
  const [userId, setUserId] = useState("");

  const available = tenantUsers.filter((u) => u.isActive && u.tenantRole !== "owner");
  const isDuplicate = Boolean(userId) && existingMemberships.some((m) => m.userId === userId && m.unitId === unitId);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-1">Vincular operador existente</p>
        <p className="text-xs text-muted-foreground">Selecione um usuário já cadastrado na entidade.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vincular-user">Usuário</Label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger id="vincular-user">
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {available.map((user) => (
              <SelectItem key={user.userId} value={user.userId}>
                {user.name || user.email || user.userId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isDuplicate && (
          <p className="text-xs text-destructive">Este operador já tem acesso a este polo.</p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isSaving || !userId || isDuplicate}
          onClick={() => void onSubmit({ userId, unitId, role: "unit_operator", isActive: true })}
        >
          {isSaving ? "Salvando..." : "Vincular"}
        </Button>
      </div>
    </div>
  );
}

// ─── Criar Operador Form ─────────────────────────────────────────────────────

interface CriarOperadorFormProps {
  readonly existingEmails: string[];
  readonly isSaving: boolean;
  readonly onSubmit: (input: TenantUserInput) => Promise<void>;
  readonly onCancel: () => void;
}

function CriarOperadorForm({ existingEmails, isSaving, onSubmit, onCancel }: CriarOperadorFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const emailExists = existingEmails.includes(email.trim().toLowerCase());
  const isValid = name.trim() && email.trim() && password.length >= 6 && !emailExists;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-1">Criar novo operador</p>
        <p className="text-xs text-muted-foreground">O usuário será criado e associado a este polo.</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="criar-nome">Nome</Label>
          <Input
            id="criar-nome"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="criar-email">E-mail</Label>
          <Input
            id="criar-email"
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
          />
          {emailExists && (
            <p className="text-xs text-destructive">Este e-mail já está cadastrado.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="criar-senha">Senha</Label>
          <Input
            id="criar-senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isSaving || !isValid}
          onClick={() =>
            void onSubmit({
              email: email.trim(),
              name: name.trim(),
              tenantRole: "member",
              mode: "create",
              password,
              autoConfirm: true,
            })
          }
        >
          {isSaving ? "Criando..." : "Criar operador"}
        </Button>
      </div>
    </div>
  );
}
