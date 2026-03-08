import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useMobile } from "@/shared/hooks/useMobile";
import { cn } from "@/shared/lib/utils";
import { useState } from "react";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useIdleTimeout } from "@/modules/auth/hooks/useIdleTimeout";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { AccessExpiredModal } from "./AccessExpiredModal";
import { Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

export function DashboardLayout() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { metadata, loading: metadataLoading } = useUserMetadata();
  const loading = authLoading || metadataLoading;
  const isMobile = useMobile();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const location = useLocation();
  useNetworkStatus();
  useIdleTimeout({
    onTimeout: () => {
      signOut();
    },
  });
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
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
    </div>
  );
}
