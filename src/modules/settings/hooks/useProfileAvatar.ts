import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { compressMemberPhoto } from "@/shared/utils/image-compression";
import { toast } from "sonner";

const BUCKET = "avatars";
const SIGNED_URL_TTL = 3600;

export function useProfileAvatar(userId: string | undefined) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const avatarPath = userId ? `${userId}.jpg` : null;

  const resolveSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const { data: profile } = await supabase
          .from("tenant_users" as never)
          .select("user_profiles(avatar_path)")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        const path = (
          (profile as Record<string, unknown>)?.user_profiles as Record<string, unknown> | null
        )?.avatar_path as string | null;

        if (path) {
          const url = await resolveSignedUrl(path);
          setAvatarUrl(url);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [userId, resolveSignedUrl]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!userId || !avatarPath) return;
    setUploading(true);
    try {
      const blob = await compressMemberPhoto(file);
      const compressed = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(avatarPath, compressed, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("user_profiles" as never)
        .update({ avatar_path: avatarPath })
        .eq("id", userId);

      if (updateError) throw updateError;

      const url = await resolveSignedUrl(avatarPath);
      setAvatarUrl(url);
      toast.success("Foto atualizada com sucesso.");
    } catch {
      toast.error("Erro ao enviar a foto.");
    } finally {
      setUploading(false);
    }
  }, [userId, avatarPath, resolveSignedUrl]);

  return { avatarUrl, isLoading, uploading, uploadAvatar };
}
