import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/shared/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { authService } from "../services/authService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

export function SetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const methods = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      const { error } = await authService.updatePassword(data.password);
      if (error) throw error;
      
      toast.success("Senha atualizada com sucesso!");
      navigate("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar a senha";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg mb-2">
          <KeyRound className="h-9 w-9 text-emerald-300" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-200">
          Nova Senha
        </h1>
        <p className="text-sm text-emerald-100/60">
          Crie uma senha forte para sua conta
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/15 bg-[rgba(10,34,20,0.75)] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={methods.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-200/80 text-sm font-medium">
                    Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Nova senha"
                        required
                        className="h-11 pr-12 bg-white/5 border-white/10 text-emerald-50 placeholder:text-emerald-100/30 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-emerald-300/50 hover:text-emerald-300 hover:bg-white/10 transition-all duration-200"
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
                  <FormLabel className="text-emerald-200/80 text-sm font-medium">
                    Confirmar Senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirme a nova senha"
                      required
                      className="h-11 bg-white/5 border-white/10 text-emerald-50 placeholder:text-emerald-100/30 focus:border-emerald-400/50 focus:ring-emerald-400/20 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            <Button
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:shadow-emerald-800/40 mt-4"
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
