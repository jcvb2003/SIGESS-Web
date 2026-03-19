import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { Button } from "@/shared/components/ui/button";
import { usePasswordChange } from "../../hooks/usePasswordChange";
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export function PasswordChangeForm() {
  const { changePassword, isLoading } = usePasswordChange();
  const methods = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const onSubmit = async (data: PasswordChangeFormData) => {
    await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    methods.reset();
  };
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Alterar Senha</CardTitle>
        <CardDescription>
          Defina uma nova senha de acesso para o usuário atualmente autenticado.
        </CardDescription>
      </CardHeader>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 border-t border-border/10">
            <input
              type="text"
              autoComplete="username"
              name="username"
              aria-hidden="true"
              className="hidden"
              tabIndex={-1}
            />
            <div className="space-y-2">
              <TextField
                control={methods.control}
                name="currentPassword"
                label="Senha atual"
                type="password"
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                control={methods.control}
                name="newPassword"
                label="Nova senha"
                type="password"
                autoComplete="new-password"
              />
              <TextField
                control={methods.control}
                name="confirmPassword"
                label="Confirmar nova senha"
                type="password"
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
