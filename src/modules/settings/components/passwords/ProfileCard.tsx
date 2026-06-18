import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { supabase } from "@/shared/lib/supabase/client";
import { KeyRound, User, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export function ProfileCard() {
  const { metadata, loading } = useUserMetadata();
  const { user } = useAuth();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = metadata?.profileName || user?.email || "—";

  const startEdit = () => {
    setName(metadata?.profileName || "");
    setIsEditingName(true);
  };

  const cancelEdit = () => {
    setIsEditingName(false);
    setName("");
  };

  const saveName = async () => {
    if (!user?.id || !name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("User")
        .update({ nome: name.trim() })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Nome atualizado com sucesso.");
      setIsEditingName(false);
    } catch {
      toast.error("Erro ao salvar o nome.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border/10 pt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                {loading ? (
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                ) : isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-sm w-48"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") cancelEdit(); }}
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary" onClick={saveName} disabled={saving}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground" onClick={cancelEdit} disabled={saving}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{displayName}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={startEdit}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setIsPasswordOpen(true)}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Alterar senha
            </Button>
          </div>

          {/* Label de campo para acessibilidade no modo de edição inline */}
          {isEditingName && (
            <Label className="sr-only" htmlFor="profile-name">Nome</Label>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="p-0 border-none sm:max-w-md">
          <PasswordChangeForm onSuccess={() => setIsPasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
