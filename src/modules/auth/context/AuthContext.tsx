import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase/client";
import { authService } from "../services/authService";
import type { LoginCredentials } from "../types/auth.types";
import { toast } from "sonner";
import { AuthContext } from "./authContextStore";
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const signOutInProgressRef = useRef(false);
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await authService.getSession();
        if (error) {
          console.error("Error checking session:", error);
          // Se o erro for relacionado a token inválido ou não encontrado, limpa o estado
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
        console.error("Unexpected error checking session:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
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
    return () => subscription.unsubscribe();
  }, []);
  const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const { error } = await authService.signIn(credentials);
      if (error) {
        const message = error.message || "Erro ao realizar login";
        toast.error(message);
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
  const value = useMemo(() => ({ user, session, loading, signIn, signOut }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
