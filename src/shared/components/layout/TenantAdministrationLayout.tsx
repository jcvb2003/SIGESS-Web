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
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-0 md:px-6 lg:px-10">

          {/* Logo */}
          <div className="flex items-center gap-3 py-3 min-w-0 flex-1">
            {entity?.logoUrl ? (
              <img
                src={entity.logoUrl}
                alt={entity.shortName || "Logo"}
                className="h-8 w-8 shrink-0 rounded-lg object-contain border border-border/40 bg-card p-1"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                {entity?.shortName?.slice(0, 2).toUpperCase() || "SG"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground leading-tight">
                {entity?.name || "SIGESS"}
              </p>
            </div>
          </div>

          {/* Portal label — centrado */}
          <div className="hidden sm:flex items-center px-4 py-3 border-x border-border/40 text-muted-foreground">
            <span className="text-xs font-medium tracking-wide uppercase whitespace-nowrap">
              Portal do Gestor
            </span>
          </div>

          {/* Sair */}
          <div className="flex items-center justify-end flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void signOut()}
              className="gap-2 h-8 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
