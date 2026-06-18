import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase/client";

const SIGNED_URL_TTL = 3600;

export function useProfileAvatarUrl(avatarPath: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      setSignedUrl(null);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, SIGNED_URL_TTL)
      .then(({ data }) => setSignedUrl(data?.signedUrl ?? null))
      .catch(() => setSignedUrl(null));
  }, [avatarPath]);

  return signedUrl;
}
