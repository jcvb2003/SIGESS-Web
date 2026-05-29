import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useMobile } from "@/shared/hooks/useMobile";
import { cn } from "@/shared/lib/utils";
import { useCallback, useState } from "react";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useIdleTimeout } from "@/modules/auth/hooks/useIdleTimeout";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { AccessExpiredModal } from "./AccessExpiredModal";
import { Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { PWABanner } from "@/shared/components/feedback/PWABanner";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
import { usePortalContext } from "@/shared/hooks/usePortalContext";

export function DashboardLayout() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { activeUnit, hasMultipleUnits, hydrated } = useTenantUnits();
  const { metadata, loading: metadataLoading } = useUserMetadata(activeUnit?.id);
  const { isPortalContextLoading, isStatePortal } = usePortalContext();
  const loading = authLoading || metadataLoading;
  const isMobile = useMobile();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const location = useLocation();
  const handleIdleTimeout = useCallback(() => {
    void signOut();
  }, [signOut]);
  useNetworkStatus();
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
    <div className="min-h-screen bg-background relative flex flex-col font-sans">
      <div className="flex flex-1 relative">
        <AppSidebar
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          isHovered={isSidebarHovered}
        />

        <main
          className={cn(
            "flex-1 p-4 md:p-6 lg:p-10 transition-all duration-300 ease-in-out min-w-0 w-full overflow-x-hidden",
            isMobile ? "pt-16" : "pt-4",
          )}
        >
          <div className="mx-auto max-w-7xl animate-in fade-in-50 duration-500 slide-in-from-bottom-4">
            <Outlet />
          </div>
        </main>
      </div>

      {metadata?.isExpired && <AccessExpiredModal open={true} />}
      <PWABanner />
    </div>
  );
}
