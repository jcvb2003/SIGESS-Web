import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "../hooks/useLogin";
import { authService } from "../services/authService";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Fish } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { toast } from "sonner";
import { isLegacyMode, LEGACY_TENANT_CODE, isDev, DEV_DEFAULT_TENANT } from "@/config/appMode";

const loginSchema = z.object({
  tenantCode: z.string().min(1, "O código da entidade é obrigatório"),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const forgotPasswordSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function LoginForm() {
  const { login, loading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  let initialTenantCode = "";
  if (isLegacyMode) {
    initialTenantCode = LEGACY_TENANT_CODE;
  } else if (isDev) {
    initialTenantCode = DEV_DEFAULT_TENANT;
  }

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantCode: initialTenantCode,
      email: "",
      password: "",
    },
  });

  const resetMethods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const onResetPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setResetLoading(true);
    try {
      const { error } = await authService.resetPassword(data.email);
      if (error) throw error;
      toast.success("Link de recuperação enviado para o seu e-mail!");
      setIsForgotPassword(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao enviar link";
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg mb-2">
          <Fish className="h-9 w-9 text-primary/80" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          SIGESS
        </h1>
        <p className="text-sm text-foreground/60">
          Sistema de Gestão para Sindicatos de Pescadores Artesanais
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            {isForgotPassword ? "Recuperar Senha" : "Área do Administrador"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isForgotPassword
              ? "Enviaremos um link de recuperação para o seu email."
              : "Entre com suas credenciais para acessar o sistema."}
          </p>
        </div>

        {isForgotPassword ? (
          <FormProvider key="reset-provider" {...resetMethods}>
            <form onSubmit={resetMethods.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
              <FormField
                control={resetMethods.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-sm font-medium">
                      Email cadastrado
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        required
                        className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <div className="pt-2 space-y-3">
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200"
                  type="submit"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  Voltar para o Login
                </Button>
              </div>
            </form>
          </FormProvider>
        ) : (
          <FormProvider key="login-provider" {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
              {!isLegacyMode && (
                <FormField
                  control={methods.control}
                  name="tenantCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-sm font-medium">
                        Código da Entidade
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Ex: Colonia z-x"
                          autoComplete="off"
                          required
                          className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={methods.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-sm font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        required
                        className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

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
                          autoComplete="current-password"
                          placeholder="Senha"
                          required
                          className="h-11 pr-12 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-primary/50 hover:text-primary hover:bg-white/10 transition-all duration-200 group"
                          aria-label={
                            showPassword ? "Ocultar senha" : "Mostrar senha"
                          }
                        >
                          <Fish
                            className={`h-5 w-5 transition-transform duration-300 ${showPassword ? "scale-x-[-1] text-primary" : ""
                              }`}
                          />
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Fish className="mr-2 h-5 w-5" />
                      Entrar
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Esqueci a senha
                </button>
              </div>
            </form>
          </FormProvider>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground/30">
        Sindicato dos Pescadores Artesanais &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
