import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  initSupabaseClient,
  initLegacyClient,
  clearSupabaseClient,
} from "@/shared/lib/supabase/client";
import { authService } from "../services/authService";
import type { LoginCredentials } from "../types/auth.types";
import { toast } from "sonner";
import { AuthContext } from "./authContextStore";
import { isLegacyMode, LEGACY_TENANT_CODE } from "@/config/appMode";

const TENANT_KEY = "sigess_tenant";

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
        /**
         * CASO 1: Modo legado (projetos antigos da Vercel).
         * Inicializa o cliente diretamente pelas variáveis genéricas.
         * O usuário não precisa digitar código — o tenant é fixo por projeto.
         */
        if (isLegacyMode) {
          if (LEGACY_TENANT_CODE) {
            initSupabaseClient(LEGACY_TENANT_CODE);
          } else {
            initLegacyClient();
          }
          attachListener();
          const { data, error } = await authService.getSession();
          if (!error) {
            setSession(data?.session ?? null);
            setUser(data?.session?.user ?? null);
          }
          setLoading(false);
          return;
        }

        /**
         * CASO 2: Modo multi-tenant com tenant salvo no localStorage.
         * Restaura o cliente do tenant anterior e tenta recuperar a sessão.
         */
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

        /**
         * CASO 3: Modo multi-tenant sem tenant salvo.
         * Nenhum cliente é inicializado. A aplicação permanece na tela de login.
         * Não há erro aqui — é o estado inicial esperado.
         */
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

  const signIn = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      if (!isLegacyMode) {
        // Modo multi-tenant: inicializa o cliente do tenant escolhido pelo usuário
        initSupabaseClient(credentials.tenantCode);
        attachListener();
      }
      // Modo legado: cliente já foi inicializado no useEffect — usa o Proxy diretamente

      const { data, error } = await authService.signIn(credentials);
      if (error) {
        let message = error.message || "Erro ao realizar login";
        if (message === "Invalid login credentials") {
          message = "Código, email ou senha incorretos";
        }
        toast.error(message);
        clearSupabaseClient(); // Remove a tentativa falha
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
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao realizar login";
      console.error("Login error:", error);
      toast.error(message);
      if (!isLegacyMode) clearSupabaseClient();
      return false;
    }
  };

  const signOut = async (): Promise<boolean> => {
    if (signOutInProgressRef.current) {
      return false;
    }
    signOutInProgressRef.current = true;
    try {
      // Tenta deslogar no Supabase, mas não bloqueia se falhar (ex: cliente não inicializado)
      await authService.signOut().catch((err) => {
        console.warn("Supabase signOut error (expected if not initialized):", err);
      });

      // SEMPRE limpa o estado local e redireciona
      clearSupabaseClient();
      setSession(null);
      setUser(null);
      
      toast.success("Logout realizado com sucesso!");

      if (typeof globalThis !== "undefined") {
        globalThis.location.href = "/";
      }

      return true;
    } catch (error: unknown) {
      console.error("Logout unexpected error:", error);
      // Mesmo em erro inesperado, limpamos o cliente
      clearSupabaseClient();
      if (typeof globalThis !== "undefined") {
        globalThis.location.href = "/";
      }
      return true;
    } finally {
      signOutInProgressRef.current = false;
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ user, session, loading, signIn, signOut }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
