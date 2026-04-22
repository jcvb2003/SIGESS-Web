import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase/client";
import { useAuth } from "../context/authContextStore";

interface UserMetadata {
  max_socios: number | null;
  acesso_expira_em: string | null;
  isExpired: boolean;
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
        const { data: configData, error: configError } = await supabase
          .from("configuracao_entidade")
          .select("max_socios, acesso_expira_em")
          .limit(1)
          .maybeSingle();

        if (configError) {
          console.error("Error fetching config metadata:", configError);
          return;
        }

        const isExpired = configData?.acesso_expira_em 
          ? new Date(configData.acesso_expira_em) < new Date() 
          : false;

        setMetadata({
          max_socios: configData?.max_socios || 100,
          acesso_expira_em: configData?.acesso_expira_em || null,
          isExpired,
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
