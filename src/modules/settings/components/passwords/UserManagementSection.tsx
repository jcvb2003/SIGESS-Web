import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  UserCheck,
  Loader2,
  Mail,
  Search
} from "lucide-react";
import { useUserManagement } from "../../hooks/useUserManagement";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { cn } from "@/shared/lib/utils";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";

export function UserManagementSection() {
  const { users, isLoading, inviteUser, toggleUserStatus, isProcessing } = useUserManagement();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado do formulário de convite
  const [inviteForm, setInviteForm] = useState<{
    email: string;
    nome: string;
    role: 'admin' | 'user';
  }>({
    email: "",
    nome: "",
    role: "user",
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteUser(inviteForm.email, inviteForm.nome, inviteForm.role);
    setIsInviteOpen(false);
    setInviteForm({ email: "", nome: "", role: "user" });
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

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm font-bold">
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleInvite}>
              <DialogHeader>
                <DialogTitle>Convidar Usuário</DialogTitle>
                <DialogDescription>
                  Um convite será enviado para o e-mail informado. O usuário poderá definir sua senha ao acessar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input 
                    id="nome" 
                    placeholder="Ex: João Silva" 
                    required 
                    value={inviteForm.nome}
                    onChange={e => setInviteForm(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@exemplo.com" 
                    required 
                    value={inviteForm.email}
                    onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Nível de Acesso (Perfil)</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(v: 'admin' | 'user') => setInviteForm(prev => ({ ...prev, role: v }))}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Presidente (Administrador)</SelectItem>
                      <SelectItem value="user">Auxiliar (Restrito)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    * Auxiliares não podem cancelar pagamentos ou alterar configurações críticas.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto font-bold">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Convite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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

        <div className="rounded-xl border border-border/60 overflow-hidden bg-background">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[30%]">Nome / Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                    <p className="text-xs text-muted-foreground mt-2">Carregando usuários...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">{u.nome || "Sem nome"}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                          <Mail className="h-2.5 w-2.5" />
                          {u.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {u.role === 'admin' ? (
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
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell font-mono">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      {u.ativo ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-none font-bold text-[10px]">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500/20 shadow-none font-bold text-[10px] hover:bg-red-500/10">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isProcessing}
                        className={cn(
                          "h-8 gap-2 font-bold",
                          u.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        )}
                        onClick={() => toggleUserStatus(u.id, u.ativo)}
                      >
                        {u.ativo ? (
                          <>
                            <UserX className="h-4 w-4" />
                            <span className="hidden sm:inline">Desativar</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">Ativar</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
