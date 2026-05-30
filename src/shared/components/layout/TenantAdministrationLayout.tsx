import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, LogOut, Settings2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
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
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6 lg:px-10">
          {/* Identity */}
          <div className="flex items-center gap-3 min-w-0">
            {entity?.logoUrl ? (
              <img
                src={entity.logoUrl}
                alt={entity.shortName || "Logo"}
                className="h-9 w-9 shrink-0 rounded-lg object-contain border border-border/40 bg-card p-1"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-primary/10 text-xs font-bold text-primary">
                {entity?.shortName?.slice(0, 2).toUpperCase() || "SG"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {entity?.name || "SIGESS"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {entity?.shortName && entity.shortName !== entity.name
                  ? entity.shortName
                  : "Entidade"}
              </p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 shrink-0" />

          {/* Portal label */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Settings2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">Portal do Gestor</span>
          </div>

          <div className="flex-1" />

          <Button variant="ghost" size="sm" onClick={() => void signOut()} className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
