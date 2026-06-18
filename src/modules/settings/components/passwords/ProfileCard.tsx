import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { KeyRound, User } from "lucide-react";

export function ProfileCard() {
  const { metadata, loading } = useUserMetadata();
  const { user } = useAuth();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const displayName = metadata?.profileName ?? user?.email ?? "—";

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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                {loading ? (
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  <span className="text-sm font-medium truncate block">{displayName}</span>
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
