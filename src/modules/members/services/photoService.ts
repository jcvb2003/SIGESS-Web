import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
export const photoService = {
  getPhotoUrl(cpf: string): string | null {
    if (!cpf) return null;
    try {
      const cleanCpf = String(cpf).replaceAll(/\D/g, "");
      const fileName = `${cleanCpf}.jpg`;

      const { data } = supabase.storage
        .from("fotos")
        .getPublicUrl(fileName);

      // URL estática sem timestamp — permite que o CDN sirva do cache
      return data?.publicUrl ?? null;
    } catch (e) {
      console.error("Erro ao gerar URL da foto no photoService:", e);
      return null;
    }
  },

  async uploadPhoto(file: File, cpf: string): Promise<ServiceResponse<string>> {
    try {
      if (!cpf) return { data: null, error: new Error("CPF é obrigatório") };
      const cleanCpf = String(cpf).replaceAll(/\D/g, "");
      const fileName = `${cleanCpf}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("fotos")
        .upload(fileName, file, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "3600", // 1h de cache no CDN
        });

      if (uploadError) {
        console.error("Erro ao fazer upload da foto:", uploadError);
        return { data: null, error: uploadError };
      }

      const { data: publicUrlData } = supabase.storage
        .from("fotos")
        .getPublicUrl(fileName);

      if (!publicUrlData.publicUrl)
        return { data: null, error: new Error("Erro ao gerar URL pública") };

      // URL estática — o browser e CDN podem cachear normalmente
      return {
        data: publicUrlData.publicUrl,
        error: null,
      };
    } catch (error) {
      console.error("Erro inesperado ao fazer upload da foto:", error);
      return { data: null, error: error as Error };
    }
  },

  async deletePhoto(cpf: string): Promise<ServiceResponse<void>> {
    try {
      if (!cpf) return { data: null, error: null };
      const cleanCpf = String(cpf).replaceAll(/\D/g, "");
      const fileName = `${cleanCpf}.jpg`;

      const { error: storageError } = await supabase.storage
        .from("fotos")
        .remove([fileName]);

      if (storageError) {
        console.error("Erro ao remover do storage:", storageError);
      }

      return { data: null, error: null };
    } catch (error) {
      console.error("Erro inesperado ao deletar foto:", error);
      return { data: null, error: error as Error };
    }
  },
};
