import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { useMobile } from "@/shared/hooks/useMobile";
import { cn } from "@/shared/lib/utils";
import { useCallback, useState } from "react";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useIdleTimeout } from "@/modules/auth/hooks/useIdleTimeout";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useProfileAvatar } from "@/modules/settings/hooks/useProfileAvatar";
import { AccessExpiredModal } from "./AccessExpiredModal";
import { Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { PWABanner } from "@/shared/components/feedback/PWABanner";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
import { usePortalContext } from "@/shared/hooks/usePortalContext";
import { PortariaProvider } from "@/shared/context/PortariaContext";
import { GlobalMemberSearch } from "./GlobalMemberSearch";
import { GlobalPortariaSelect } from "./GlobalPortariaSelect";
import { MemberDetailsModal } from "@/modules/members/components/modal/MemberDetailsModal";

export function DashboardLayout() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const { activeUnit, hasMultipleUnits, hydrated } = useTenantUnits();
  const { metadata, loading: metadataLoading } = useUserMetadata();
  const { avatarUrl } = useProfileAvatar(user?.id);
  const { isPortalContextLoading, isStatePortal } = usePortalContext();
  const loading = authLoading || metadataLoading;
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [globalSelectedMemberId, setGlobalSelectedMemberId] = useState<string | null>(null);
  const location = useLocation();
  const handleIdleTimeout = useCallback(() => {
    void signOut();
  }, [signOut]);
  useNetworkStatus();

  // html/body não têm overflow:hidden por padrão, o que permite que o documento
  // scroll quando o conteúdo (ex: /registration) ultrapassa o viewport.
  // Com isso o sidebar — que tem sticky bloqueado pelo overflow:hidden do container
  // pai — sobe junto com o documento. Bloquear aqui evita o scroll do documento
  // sem afetar rotas fora do DashboardLayout (login, impressão, portal de pagamento).
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  useIdleTimeout({
    onTimeout: handleIdleTimeout,
  });
  if (loading || isPortalContextLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (isStatePortal && location.pathname !== "/administration") {
    return <Navigate to="/administration" replace />;
  }

  if (
    hydrated &&
    hasMultipleUnits &&
    !activeUnit &&
    location.pathname !== "/select-unit"
  ) {
    return <Navigate to="/select-unit" replace />;
  }

  if (
    hydrated &&
    location.pathname === "/select-unit" &&
    (!hasMultipleUnits || activeUnit)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PortariaProvider>
      <div className="h-screen overflow-hidden bg-background flex font-sans">
        <AppSidebar
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          isHovered={isSidebarHovered}
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <header
            className="hidden lg:flex h-14 shrink-0 items-center px-5 bg-background"
            style={{
              borderBottom: "1px solid transparent",
              backgroundImage: "linear-gradient(hsl(var(--background)), hsl(var(--background))), linear-gradient(to right, transparent 5%, #00DF81 50%, transparent 95%)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            <div className="w-64 shrink-0" />

            <div className="flex-1 flex justify-center px-4">
              <GlobalMemberSearch onSelect={setGlobalSelectedMemberId} />
            </div>

            <div className="flex items-center justify-end gap-4 w-64 shrink-0 min-w-0">
              <GlobalPortariaSelect />
              <div className="h-6 w-px bg-border shrink-0" />
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold ring-2 ring-primary/25 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      {metadata?.profileName?.charAt(0)?.toUpperCase()
                        ?? (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase()
                        ?? user?.email?.charAt(0)?.toUpperCase()
                        ?? "?"}
                    </>
                  )}
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {metadata?.profileName
                      ?? (user?.user_metadata?.full_name as string | undefined)
                      ?? user?.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main
            className={cn(
              "flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 transition-all duration-300 ease-in-out",
              isMobile && "pt-16",
            )}
          >
            <div className="mx-auto max-w-7xl animate-in fade-in-50 duration-500 slide-in-from-bottom-4">
              <Outlet />
            </div>
          </main>
        </div>

        <MemberDetailsModal
          open={!!globalSelectedMemberId}
          onOpenChange={(open) => { if (!open) setGlobalSelectedMemberId(null); }}
          memberUuid={globalSelectedMemberId}
          onEdit={(id) => {
            setGlobalSelectedMemberId(null);
            navigate(`/members/${id}`);
          }}
          onDelete={() => {
            setGlobalSelectedMemberId(null);
            navigate("/members");
          }}
          onDocuments={() => {
            setGlobalSelectedMemberId(null);
            navigate("/documents");
          }}
        />

        {metadata?.isExpired && <AccessExpiredModal open={true} />}
        <PWABanner />
      </div>
    </PortariaProvider>
  );
}
