import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { usePortalContext } from "@/shared/hooks/usePortalContext";

export function TenantAdministrationLayout() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { isPortalContextLoading, isStatePortal } = usePortalContext();
  const { entity } = useEntityData();
  const location = useLocation();

  if (authLoading || isPortalContextLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isStatePortal) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            {entity?.logoUrl ? (
              <img
                src={entity.logoUrl}
                alt={entity.shortName || "Logo"}
                className="h-10 w-10 rounded-xl object-contain border border-border/40 bg-card p-1.5"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-card text-sm font-bold text-primary">
                SG
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {entity?.name || "SIGESS"}
              </p>
              <p className="text-xs text-muted-foreground">
                Portal do Gestor
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => void signOut()} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
