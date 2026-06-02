import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/layout/DataTable";
import { Badge } from "@/shared/components/ui/badge";
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Loader2,
  Mail,
  Search,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useUserManagement } from "../../hooks/useUserManagement";
import { PasswordChangeForm } from "./PasswordChangeForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useAuth } from "@/modules/auth/context/authContextStore";

export function UserManagementSection() {
  const { users, loading, fetchUsers, toggleUserStatus, createUser, inviteUser, deleteUser, resendConfirmation } = useUserManagement();
  const { isAdmin } = usePermissions();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const canManageScopedUsers = isAdmin;

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"invite" | "create">("invite");
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; nome: string } | null>(null);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);

  const isProcessing = loading;
  const isLoading = loading;

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [form, setForm] = useState({
    email: "",
    nome: "",
    role: "operador_administrativo",
    password: "",
    autoConfirm: true,
  });

  const handleSubmit = async () => {
    let result;
    if (activeTab === "invite") {
      result = await inviteUser({ email: form.email, nome: form.nome, role: form.role });
    } else {
      result = await createUser({ email: form.email, nome: form.nome, role: form.role, password: form.password, email_confirm: form.autoConfirm });
    }
    if (result && !result.error) {
      setIsInviteOpen(false);
      setForm({ email: "", nome: "", role: "operador_administrativo", password: "", autoConfirm: true });
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.nome?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Usuários do Sistema
          </CardTitle>
          <CardDescription>
            Controle quem pode acessar o SIGESS e quais são suas permissões.
          </CardDescription>
        </div>

        {canManageScopedUsers && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm font-bold">
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <DialogTitle className="text-xl">Adicionar Usuário</DialogTitle>
                </div>
                <DialogDescription className="text-sm">
                  Selecione o método de entrada e preencha as credenciais de acesso.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6 space-y-6">
                {/* Seletor de Modo */}
                <div className="grid grid-cols-2 gap-3 p-1 bg-muted/30 rounded-xl border border-border/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab("invite")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-200",
                      activeTab === "invite"
                        ? "bg-background text-primary shadow-sm border border-primary/10"
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    <Mail className={cn("h-5 w-5", activeTab === "invite" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-bold uppercase tracking-wider">Convite</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-200",
                      activeTab === "create"
                        ? "bg-background text-primary shadow-sm border border-primary/10"
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    <ShieldCheck className={cn("h-5 w-5", activeTab === "create" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-bold uppercase tracking-wider">Manual</span>
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="nome" className="text-xs font-bold text-muted-foreground uppercase">Nome Completo</Label>
                      <Input id="nome" placeholder="Ex: João Silva" required className="bg-muted/10 border-border/50 focus:bg-background" value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase">E-mail</Label>
                      <Input id="email" type="email" placeholder="email@exemplo.com" required className="bg-muted/10 border-border/50 focus:bg-background" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="role" className="text-xs font-bold text-muted-foreground uppercase">Nível de Acesso (Perfil)</Label>
                    <Select value={form.role} onValueChange={(v) => setForm(prev => ({ ...prev, role: v }))}>
                      <SelectTrigger id="role" className="bg-muted/10 border-border/50 focus:bg-background">
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Presidente (Administrador)</SelectItem>
                        <SelectItem value="operador_administrativo">Auxiliar (Restrito)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-2 rounded-md border border-border/30">
                      * Auxiliares possuem acesso limitado a cancelamentos e configurações críticas do sistema.
                    </p>
                  </div>

                  <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", activeTab === "create" ? "max-h-[200px] opacity-100 pt-2" : "max-h-0 opacity-0")}>
                    <div className="p-4 rounded-xl border border-border/50 bg-muted/5 space-y-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase">Senha Inicial</Label>
                        <div className="relative">
                          <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required={activeTab === "create"} minLength={6} className="bg-background pr-10 border-border/50" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="auto-confirm" checked={form.autoConfirm} onCheckedChange={(checked) => setForm(prev => ({ ...prev, autoConfirm: !!checked }))} />
                        <Label htmlFor="auto-confirm" className="text-xs font-medium leading-none cursor-pointer text-muted-foreground">
                          Confirmar usuário automaticamente (sem validar e-mail)
                        </Label>
                      </div>
                    </div>
                  </div>

                  {activeTab === "invite" && (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex gap-3">
                        <Mail className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Fluxo de Convite</p>
                          <p className="text-[11px] text-emerald-700 leading-relaxed">
                            O usuário receberá um e-mail oficial para configurar sua própria senha e ativar a conta de forma segura.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button type="submit" disabled={isProcessing} className="w-full font-bold shadow-lg shadow-primary/10 h-11 text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95">
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          {activeTab === "invite" ? <Mail className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          {activeTab === "invite" ? "Enviar Convite" : "Criar Usuário Agora"}
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent className="space-y-4 border-t border-border/10 pt-4">
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 bg-muted/20 border-border/40"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <DataTable
          data={filteredUsers}
          isLoading={isLoading}
          onRetry={fetchUsers}
          emptyMessage="Nenhum usuário encontrado"
          emptyDescription="Não há usuários que correspondam aos filtros de busca atuais."
          columns={[
            {
              header: "Nome / Usuário",
              className: "w-[30%]",
              cell: (u) => (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{u.nome || "Sem nome"}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                    <Mail className="h-2.5 w-2.5" />
                    {u.email}
                  </span>
                  {!u.tenantRole && !u.emailConfirmedAt && (
                    <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">
                      ● E-mail não confirmado
                    </span>
                  )}
                </div>
              )
            },
            {
              header: "Perfil",
              cell: (u) => (
                <div className="flex items-center gap-1.5">
                  {u.tenantRole === 'owner' || u.operatorType === 'presidente' || u.role === 'admin' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 py-0.5 px-2 font-bold uppercase text-[9px]">
                      <ShieldCheck className="h-3 w-3" />
                      Presidente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1 py-0.5 px-2 font-bold uppercase text-[9px]">
                      <ShieldAlert className="h-3 w-3" />
                      Auxiliar
                    </Badge>
                  )}
                </div>
              )
            },
            {
              header: "Cadastro",
              className: "hidden md:table-cell",
              cell: (u) => (
                <span className="text-xs text-muted-foreground">
                  {u.createdAt ? formatDate(u.createdAt) : "-"}
                </span>
              )
            },
            {
              header: "Status",
              cell: (u) => u.ativo ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-none font-bold text-[10px]">
                  Ativo
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20 shadow-none font-bold text-[10px] hover:bg-red-500/10">
                  Inativo
                </Badge>
              )
            },
            {
              header: "Ações",
              headerClassName: "text-right",
              className: "text-right",
              cell: (u) => {
                const isSelf = u.id === currentUserId;
                
                // Se não for admin e não for o próprio usuário, não vê ações
                if (!canManageScopedUsers && !isSelf) return null;

                const isConfirmed = !!u.emailConfirmedAt;
                const canResendConfirmation = !u.tenantRole && !isConfirmed && canManageScopedUsers;

                const toggleButtonClass = (() => {
                  if (isSelf) return "opacity-40 cursor-not-allowed";
                  return u.ativo
                    ? "text-slate-700 hover:bg-red-600 hover:text-white hover:border-red-600 hover:scale-105 active:scale-95"
                    : "text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:scale-105 active:scale-95";
                })();

                return (
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Alterar Senha — Só para o próprio usuário */}
                    {isSelf && (
                      <Dialog open={isPasswordChangeOpen} onOpenChange={setIsPasswordChangeOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Alterar minha senha"
                            className="h-8 gap-1.5 font-bold text-primary border-primary/20 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Senha</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="p-0 border-none sm:max-w-md">
                          <PasswordChangeForm onSuccess={() => setIsPasswordChangeOpen(false)} />
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Reenviar confirmação — só se não confirmado e admin */}
                    {canResendConfirmation && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing}
                        title="Reenviar link de confirmação de e-mail"
                        className="h-8 gap-1.5 font-bold text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
                        onClick={() => resendConfirmation(u.email)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Confirmar</span>
                      </Button>
                    )}

                    {/* Ativar / Desativar — só admin */}
                    {canManageScopedUsers && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing || isSelf}
                        title={isSelf ? "Não é possível alterar o próprio status" : undefined}
                        className={cn(
                          "h-8 gap-1.5 font-bold transition-all duration-200 shadow-sm",
                          toggleButtonClass
                        )}
                        onClick={() => { if (!isSelf) toggleUserStatus(u.id, u.ativo); }}
                      >
                        {u.ativo ? (
                          <><UserX className="h-4 w-4" /><span className="hidden sm:inline">Desativar</span></>
                        ) : (
                          <><UserCheck className="h-4 w-4" /><span className="hidden sm:inline">Ativar</span></>
                        )}
                      </Button>
                    )}

                    {/* Excluir — só admin, nunca o próprio usuário */}
                    {canManageScopedUsers && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing || isSelf}
                        title={isSelf ? "Não é possível excluir o próprio usuário" : "Excluir usuário permanentemente"}
                        className={cn(
                          "h-8 gap-1.5 font-bold transition-all duration-200 shadow-sm",
                          isSelf
                            ? "opacity-40 cursor-not-allowed"
                            : "text-red-700 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 hover:scale-105 active:scale-95"
                        )}
                        onClick={() => { if (!isSelf) setDeleteConfirm({ userId: u.id, nome: u.nome || u.email }); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    )}
                  </div>
                );
              }
            }
          ]}
        />
      </CardContent>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong className="text-foreground">{deleteConfirm?.nome}</strong> será permanentemente removido do sistema. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteUser(deleteConfirm.userId);
                  setDeleteConfirm(null);
                }
              }}
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
