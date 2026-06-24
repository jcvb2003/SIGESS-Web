import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { useMobile } from "@/shared/hooks/useMobile";
import { cn } from "@/shared/lib/utils";
import { useCallback, useState } from "react";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useIdleTimeout } from "@/modules/auth/hooks/useIdleTimeout";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useProfileAvatarUrl } from "@/modules/settings/hooks/useProfileAvatarUrl";
import { usePresenceHeartbeat } from "@/shared/hooks/usePresenceHeartbeat";
import { AccessExpiredModal } from "./AccessExpiredModal";
import { BillingBlockedModal } from "./BillingBlockedModal";
import { useBillingSummary } from "@/modules/billing/hooks/data/useBillingSummary";
import { Loader2, User, LogOut, Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { PWABanner } from "@/shared/components/feedback/PWABanner";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
import { usePortalContext } from "@/shared/hooks/usePortalContext";
import { useTenantMode } from "@/shared/hooks/useTenantMode";
import { useTheme } from "next-themes";
import { PortariaProvider } from "@/shared/context/PortariaContext";
import { GlobalMemberSearch } from "./GlobalMemberSearch";
import { GlobalPortariaSelect } from "./GlobalPortariaSelect";
import { MemberDetailsModal } from "@/modules/members/components/modal/MemberDetailsModal";

export function DashboardLayout() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const { activeUnit, hasMultipleUnits, hydrated } = useTenantUnits();
  const { metadata, loading: metadataLoading } = useUserMetadata();
  const { data: billingSummary } = useBillingSummary();
  const { theme, setTheme } = useTheme();
  const avatarUrl = useProfileAvatarUrl(metadata?.avatarPath);
  usePresenceHeartbeat();
  const { isPortalContextLoading, isStatePortal } = usePortalContext();
  const tenantMode = useTenantMode();
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

  const AGRICULTURE_BLOCKED = ['/requirements', '/reap'];
  if (tenantMode === 'agricultura' && AGRICULTURE_BLOCKED.includes(location.pathname)) {
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
              backgroundImage: "linear-gradient(hsl(var(--background)), hsl(var(--background))), linear-gradient(to right, transparent 5%, hsl(var(--sidebar-background)) 50%, transparent 95%)",
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-primary/30 hover:ring-primary/60 transition-all overflow-hidden outline-none">
                    {avatarUrl ? (
                      <>
                        <div className="absolute inset-0 rounded-full" style={{ backgroundColor: "#fff" }} />
                        <img
                          src={avatarUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }} />
                        <span className="relative z-10 text-primary text-sm font-bold">
                          {metadata?.profileName?.charAt(0)?.toUpperCase()
                            ?? (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase()
                            ?? user?.email?.charAt(0)?.toUpperCase()
                            ?? "?"}
                        </span>
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
                  {/* Cabeçalho com identidade do usuário */}
                  <DropdownMenuLabel className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border/60">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-primary/20 overflow-hidden">
                        {avatarUrl ? (
                          <>
                            <div className="absolute inset-0 rounded-full" style={{ backgroundColor: "#fff" }} />
                            <img src={avatarUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0" style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }} />
                            <span className="relative z-10 text-primary text-sm font-bold">
                              {metadata?.profileName?.charAt(0)?.toUpperCase()
                                ?? (user?.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase()
                                ?? user?.email?.charAt(0)?.toUpperCase()
                                ?? "?"}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {metadata?.profileName
                            ?? (user?.user_metadata?.full_name as string | undefined)
                            ?? user?.email?.split("@")[0]}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  {/* Ações */}
                  <div className="p-1">
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer rounded-lg"
                      onClick={() => navigate("/settings?tab=senhas")}
                    >
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>Editar meu perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer rounded-lg"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Moon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span>Tema {theme === "dark" ? "Claro" : "Escuro"}</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <div className="p-1">
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
        {!metadata?.isExpired && billingSummary?.is_billing_blocked && (
          <BillingBlockedModal
            open={true}
            reason={billingSummary.billing_blocked_reason}
            paymentUrl={billingSummary.payment_url}
          />
        )}
        <PWABanner />
      </div>
    </PortariaProvider>
  );
}
