import { useEffect, useState } from "react";
import { Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import { cn } from "@/shared/lib/utils";

interface TenantUserDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (values: {
    email: string;
    name: string;
    tenantRole: "member";
    mode: "invite" | "create";
    password?: string;
    autoConfirm?: boolean;
  }) => Promise<void>;
  readonly isSaving: boolean;
}

export function TenantUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
}: TenantUserDialogProps) {
  const [mode, setMode] = useState<"invite" | "create">("invite");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoConfirm, setAutoConfirm] = useState(true);

  useEffect(() => {
    if (!open) {
      setMode("invite");
      setName("");
      setEmail("");
      setPassword("");
      setAutoConfirm(true);
    }
  }, [open]);

  const isCreateMode = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Novo usuario da entidade</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Crie ou convide um operador para esta entidade.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 p-1 bg-muted/30 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setMode("invite")}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-200",
                mode === "invite"
                  ? "bg-background text-primary shadow-sm border border-primary/10"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              <Mail className={cn("h-5 w-5", mode === "invite" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-bold uppercase tracking-wider">Convite</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-200",
                mode === "create"
                  ? "bg-background text-primary shadow-sm border border-primary/10"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              )}
            >
              <ShieldCheck className={cn("h-5 w-5", mode === "create" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-bold uppercase tracking-wider">Manual</span>
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit({
                email,
                name,
                tenantRole: "member",
                mode,
                password: isCreateMode ? password : undefined,
                autoConfirm: isCreateMode ? autoConfirm : undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="tenant-user-name" className="text-xs font-bold text-muted-foreground uppercase">
                  Nome completo
                </Label>
                <Input
                  id="tenant-user-name"
                  placeholder="Ex: Maria Silva"
                  required
                  className="bg-muted/10 border-border/50 focus:bg-background"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tenant-user-email" className="text-xs font-bold text-muted-foreground uppercase">
                  E-mail
                </Label>
                <Input
                  id="tenant-user-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  required
                  className="bg-muted/10 border-border/50 focus:bg-background"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isCreateMode ? "max-h-[220px] opacity-100 pt-2" : "max-h-0 opacity-0",
              )}
            >
              <div className="p-4 rounded-xl border border-border/50 bg-muted/5 space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="tenant-user-password" className="text-xs font-bold text-muted-foreground uppercase">
                    Senha inicial
                  </Label>
                  <Input
                    id="tenant-user-password"
                    type="password"
                    placeholder="Digite a senha inicial"
                    required={isCreateMode}
                    minLength={6}
                    className="bg-background border-border/50"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tenant-user-auto-confirm"
                    checked={autoConfirm}
                    onCheckedChange={(checked) => setAutoConfirm(Boolean(checked))}
                  />
                  <Label
                    htmlFor="tenant-user-auto-confirm"
                    className="text-xs font-medium leading-none cursor-pointer text-muted-foreground"
                  >
                    Confirmar usuario automaticamente
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isSaving} className="w-full gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {mode === "invite" ? "Enviar convite" : "Criar usuario"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
