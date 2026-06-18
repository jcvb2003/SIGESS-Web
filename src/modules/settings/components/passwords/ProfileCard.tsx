import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { supabase } from "@/shared/lib/supabase/client";
import { useProfileAvatar } from "../../hooks/useProfileAvatar";
import { KeyRound, User, Pencil, Check, X, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileCard() {
  const { metadata, loading: loadingMeta } = useUserMetadata();
  const { user } = useAuth();
  const { avatarUrl, isLoading: loadingAvatar, uploading, uploadAvatar } = useProfileAvatar(user?.id);

  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [localName, setLocalName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = localName ?? metadata?.profileName ?? user?.email ?? "—";
  const initial = displayName.charAt(0).toUpperCase();

  const startEdit = () => {
    setName(localName ?? metadata?.profileName ?? "");
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
        .from("user_profiles" as never)
        .update({ nome: name.trim() } as never)
        .eq("id", user.id);
      if (error) throw error;
      setLocalName(name.trim());
      toast.success("Nome atualizado com sucesso.");
      setIsEditingName(false);
    } catch {
      toast.error("Erro ao salvar o nome.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadAvatar(file);
    e.target.value = "";
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
        <CardContent className="border-t border-border/10 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">

              {/* Avatar clicável */}
              <button
                type="button"
                className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Alterar foto de perfil"
              >
                {/* Foto de perfil */}
                {avatarUrl && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "#fff" }}
                    />
                    <img
                      src={avatarUrl}
                      alt=""
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition: "center",
                      }}
                    />
                  </>
                )}
                {/* Cor de fundo (sem foto) */}
                {!avatarUrl && (
                  <div className="absolute inset-0" style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }} />
                )}
                {/* Inicial (sem foto) */}
                {!avatarUrl && !loadingAvatar && !uploading && (
                  <div className="relative z-10 text-primary font-bold text-sm">{initial}</div>
                )}
                {/* Spinner (carregando/uploading) */}
                {(loadingAvatar || uploading) && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/10 z-10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {/* Overlay câmera no hover */}
                {!uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Nome + e-mail */}
              <div className="min-w-0">
                {loadingMeta ? (
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                ) : isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-sm w-48"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveName();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary" onClick={() => void saveName()} disabled={saving}>
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
