import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { TenantUnitProvider } from "@/modules/tenant-units/context/TenantUnitContext";
import { EntityThemeProvider } from "@/shared/components/EntityThemeProvider";
import { ThemeProvider } from "next-themes";
export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TenantUnitProvider>
          <AuthProvider>
            <EntityThemeProvider>
              {children}
              <Toaster />
            </EntityThemeProvider>
          </AuthProvider>
        </TenantUnitProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
