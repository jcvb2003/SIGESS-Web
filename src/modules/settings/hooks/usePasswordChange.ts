import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "../services/settingsService";
import { PasswordChangeInput } from "../types/settings.types";
export function usePasswordChange() {
  const mutation = useMutation({
    mutationFn: async (values: PasswordChangeInput) => {
      const { error } = await settingsService.changePassword(values);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao alterar senha.";
      toast.error(message);
    },
  });
  return {
    changePassword: (values: PasswordChangeInput) =>
      mutation.mutateAsync(values),
    isLoading: mutation.isPending,
  };
}
