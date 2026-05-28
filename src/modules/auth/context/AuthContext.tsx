import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  initSupabaseClient,
  clearSupabaseClient,
} from "@/shared/lib/supabase/client";
import { authService } from "../services/authService";
import { clearTenantIdCache } from "@/modules/administration/services/administrationService";
import type { LoginCredentials } from "@/shared/types/auth.types";
import { toast } from "sonner";
import { AuthContext } from "./authContextStore";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

const TENANT_KEY = "sigess_tenant";
const GENERIC_AUTH_ERROR_MESSAGE = "Código, email ou senha incorretos";

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const signOutInProgressRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const { clearUnits } = useTenantUnits();

  const attachListener = () => {
    if (subscriptionRef.current) return;
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      });
      subscriptionRef.current = subscription;
    } catch {
      // Ignorado se não há tenant inicializado
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const saved =
          typeof globalThis === "undefined"
            ? null
            : globalThis.localStorage.getItem(TENANT_KEY);

        if (saved) {
          attachListener();
          const { data, error } = await authService.getSession();
          if (error) {
            console.warn("Sessão não pôde ser restaurada:", error.message);
            if (
              error.message?.includes("Refresh Token") ||
              (error as { status?: number }).status === 400
            ) {
              await supabase.auth.signOut();
            }
            clearSupabaseClient();
            setSession(null);
            setUser(null);
          } else {
            setSession(data?.session ?? null);
            setUser(data?.session?.user ?? null);
          }
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.warn("Auth init error:", error);
        setLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      await initSupabaseClient(credentials.tenantCode);
      attachListener();

      const { data, error } = await authService.signIn(credentials);
      if (error) {
        const message =
          error.message === "Invalid login credentials"
            ? GENERIC_AUTH_ERROR_MESSAGE
            : error.message || "Erro ao realizar login";
        toast.error(message);
        clearSupabaseClient();
        return false;
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
      }

      localStorage.setItem("last_activity_timestamp", Date.now().toString());
      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error(GENERIC_AUTH_ERROR_MESSAGE);
      clearSupabaseClient();
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<boolean> => {
    if (signOutInProgressRef.current) {
      return false;
    }
    signOutInProgressRef.current = true;
    try {
      await authService.signOut().catch((err) => {
        console.warn("Supabase signOut error (expected if not initialized):", err);
      });

      clearUnits();
      clearSupabaseClient();
      clearTenantIdCache();
      setSession(null);
      setUser(null);

      toast.success("Logout realizado com sucesso!");

      if (typeof globalThis !== "undefined") {
        globalThis.location.href = "/";
      }

      return true;
    } catch (error: unknown) {
      console.error("Logout unexpected error:", error);
      clearUnits();
      clearSupabaseClient();
      clearTenantIdCache();
      if (typeof globalThis !== "undefined") {
        globalThis.location.href = "/";
      }
      return true;
    } finally {
      signOutInProgressRef.current = false;
    }
  }, [clearUnits]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ user, session, loading, signIn, signOut }), [user, session, loading, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
