import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
export const photoService = {
  async getPhotoUrl(cpf: string): Promise<string | null> {
    if (!cpf) return null;
    const cleanCpf = cpf.replaceAll(/\D/g, "");
    let formattedCpf = cleanCpf;
    if (cleanCpf.length === 11) {
      formattedCpf = `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`;
    }
    try {
      const { data, error } = await supabase
        .from("fotos")
        .select("foto_url")
        .in("cpf", [cleanCpf, formattedCpf])
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Erro ao buscar foto:", error);
        return null;
      }
      const url = data?.foto_url;
      return typeof url === "string" ? url : null;
    } catch (error) {
      console.error("Erro inesperado ao buscar foto:", error);
      return null;
    }
  },
  async uploadPhoto(file: File, cpf: string): Promise<ServiceResponse<string>> {
    try {
      if (!cpf) return { data: null, error: new Error("CPF é obrigatório") };
      const cleanCpf = cpf.replaceAll(/\D/g, "");
      const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      const fileName = `${cleanCpf}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("fotos")
        .upload(fileName, file, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "0",
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
      const { error: dbError } = await supabase.from("fotos").upsert(
        {
          cpf: formattedCpf,
          foto_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "cpf" },
      );
      if (dbError) {
        console.error("Erro ao atualizar tabela de fotos:", dbError);
        return { data: null, error: dbError };
      }
      return {
        data: `${publicUrlData.publicUrl}?t=${Date.now()}`,
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
      const cleanCpf = cpf.replaceAll(/\D/g, "");
      const fileName = `${cleanCpf}.jpg`;
      const { error: storageError } = await supabase.storage
        .from("fotos")
        .remove([fileName]);
      if (storageError)
        console.error("Erro ao remover do storage:", storageError);
      let formattedCpf = cleanCpf;
      if (cleanCpf.length === 11) {
        formattedCpf = `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`;
      }
      const { error: dbError } = await supabase
        .from("fotos")
        .delete()
        .in("cpf", [cleanCpf, cpf, formattedCpf]);
      if (dbError) {
        console.error("Erro ao remover da tabela de fotos:", dbError);
        return { data: null, error: dbError };
      }
      return { data: null, error: null };
    } catch (error) {
      console.error("Erro inesperado ao deletar foto:", error);
      return { data: null, error: error as Error };
    }
  },
};
