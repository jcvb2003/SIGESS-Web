import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { useAuth } from "../context/authContextStore";

interface UserMetadata {
  max_socios: number | null;
  acesso_expira_em: string | null;
  isExpired: boolean;
  profileName: string | null;
}

export function useUserMetadata() {
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMetadata(null);
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
        const [
          { data: configData, error: configError },
          { data: profileData, error: profileError },
        ] = await Promise.all([
          supabase
            .from("tenants")
            .select("max_socios, acesso_expira_em")
            .limit(1)
            .maybeSingle(),
          supabase
            .from("user_profiles" as never)
            .select("nome")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (configError) {
          console.error("Error fetching config metadata:", configError);
          return;
        }

        if (profileError) {
          console.error("Error fetching profile metadata:", profileError);
        }

        const isExpired = configData?.acesso_expira_em 
          ? new Date(configData.acesso_expira_em) < new Date() 
          : false;

        setMetadata({
          max_socios: configData?.max_socios ?? 0,
          acesso_expira_em: configData?.acesso_expira_em || null,
          isExpired,
          profileName: profileData?.nome?.trim() || null,
        });
      } catch (err) {
        console.error("Unexpected error fetching user metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [user]);

  return { metadata, loading };
}
