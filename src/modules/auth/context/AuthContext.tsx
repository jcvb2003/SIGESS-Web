import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, initSupabaseClient, clearSupabaseClient } from "@/shared/lib/supabase/client";
import { authService } from "../services/authService";
import type { LoginCredentials } from "../types/auth.types";
import { toast } from "sonner";
import { AuthContext } from "./authContextStore";

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const signOutInProgressRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

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
        const { data, error } = await authService.getSession();
        if (error) {
          console.error("Error checking session:", error);
          if (error.message?.includes("Refresh Token") || (error as { status?: number }).status === 400) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
          }
          return;
        }
        setSession(data?.session ?? null);
        setUser(data?.session?.user ?? null);
      } catch (error) {
        console.warn("Sessão não restaurou:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
    attachListener();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Inicializar ambiente primeiro
      initSupabaseClient(credentials.tenantCode);
      attachListener(); // Escutar eventos agora que existe um cliente válido
      
      const { error } = await authService.signIn(credentials);
      if (error) {
        let message = error.message || "Erro ao realizar login";
        if (message === "Invalid login credentials") {
          message = "Código, email ou senha incorretos";
        }
        toast.error(message);
        clearSupabaseClient(); // Remove a tentativa falha
        return false;
      }
      localStorage.setItem("last_activity_timestamp", Date.now().toString());
      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao realizar login";
      console.error("Login error:", error);
      toast.error(message);
      clearSupabaseClient(); // Remove a configuração falida
      return false;
    }
  };

  const signOut = async (): Promise<boolean> => {
    if (signOutInProgressRef.current) {
      return false;
    }
    signOutInProgressRef.current = true;
    try {
      const { error } = await authService.signOut();
      if (error) {
        toast.error("Erro ao realizar logout");
        return false;
      }
      clearSupabaseClient();
      toast.success("Logout realizado com sucesso!");
      return true;
    } catch (error: unknown) {
      console.error("Logout error:", error);
      toast.error("Erro ao realizar logout");
      return false;
    } finally {
      signOutInProgressRef.current = false;
    }
  };

  // Desativando lint pois signIn/signOut não mudam seu comportamento e a dependência deles criaria renders desnecessários
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ user, session, loading, signIn, signOut }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
