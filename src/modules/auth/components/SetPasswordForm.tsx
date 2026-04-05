import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/shared/components/ui/button";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { resolveTenant } from "@/config/tenants";
import { initSupabaseClient } from "@/shared/lib/supabase/client";

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/\d/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

/**
 * Lê os tokens de convite/reset do hash da URL (ex: #access_token=...&refresh_token=...).
 * NÃO usa o Supabase SDK para detectar a sessão — isso consumiria o token imediatamente.
 */
function extractTokensFromHash(): { accessToken: string | null; refreshToken: string | null } {
  if (globalThis.window === undefined) return { accessToken: null, refreshToken: null };
  const hash = globalThis.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
  };
}

import { isLegacyMode, LEGACY_TENANT_CODE } from "@/config/appMode";

/**
 * Lê o código do tenant do query param `?tenant=` da URL, ou usa o fallback do modo legado.
 */
function extractTenantFromUrl(): string | null {
  if (globalThis.window === undefined) return null;
  const param = new URLSearchParams(globalThis.location.search).get("tenant");
  if (param) return param;
  if (isLegacyMode && LEGACY_TENANT_CODE) return LEGACY_TENANT_CODE;
  return null;
}

export function SetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Tokens lidos UMA vez no mount — não re-leituras reativas
  const tokensRef = useRef(extractTokensFromHash());
  const tenantCodeRef = useRef(extractTenantFromUrl());

  useEffect(() => {
    const { accessToken, refreshToken } = tokensRef.current;
    const tenantCode = tenantCodeRef.current;

    if (!accessToken || !refreshToken) {
      setTokenError("Link inválido ou já utilizado. Solicite um novo convite.");
      return;
    }
    if (!tenantCode || !resolveTenant(tenantCode)) {
      setTokenError("Link inválido: entidade não identificada. Solicite um novo convite.");
    }
  }, []);

  const methods = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    const { accessToken, refreshToken } = tokensRef.current;
    const tenantCode = tenantCodeRef.current;

    if (!accessToken || !refreshToken || !tenantCode) {
      toast.error("Link inválido ou expirado. Solicite um novo convite.");
      return;
    }

    const tenant = resolveTenant(tenantCode);
    if (!tenant) {
      toast.error("Entidade não encontrada. Verifique o link.");
      return;
    }

    setLoading(true);
    try {
      // Cria um client isolado (detectSessionInUrl: false) para não consumir o token ao inicializar
      const isolatedClient = createClient(tenant.supabaseUrl, tenant.supabaseAnonKey, {
        auth: {
          detectSessionInUrl: false,
          persistSession: false,
        },
      });

      // Só aqui trocamos o token por sessão — no momento do submit, não no carregamento
      const { error: sessionError } = await isolatedClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;

      const { error: updateError } = await isolatedClient.auth.updateUser({
        password: data.password,
      });
      if (updateError) throw updateError;

      // Promove a sessão para o cliente principal e inicializa o tenant
      initSupabaseClient(tenantCode);
      await initSupabaseClient(tenantCode).auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      toast.success("Senha cadastrada com sucesso! Bem-vindo ao SIGESS.");
      navigate("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar a senha";
      if (message.includes("expired") || message.includes("invalid")) {
        toast.error("Link expirado ou já utilizado. Solicite um novo convite.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg mb-2">
          <AlertTriangle className="h-9 w-9 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Link inválido</h1>
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-xl shadow-lg p-6 text-sm text-muted-foreground">
          {tokenError}
        </div>
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl border-white/10"
          onClick={() => navigate("/auth")}
        >
          Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg mb-2">
          <KeyRound className="h-9 w-9 text-primary/80" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Nova Senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Crie uma senha forte para sua conta
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={methods.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-sm font-medium">
                    Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Nova senha"
                        required
                        className="h-11 pr-12 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-white/10 transition-all duration-200"
                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        <KeyRound className="h-5 w-5" />
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-sm font-medium">
                    Confirmar Senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirme a nova senha"
                      required
                      className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 mt-4"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Senha"
              )}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
