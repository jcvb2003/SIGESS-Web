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
        const { data, error } = await supabase
          .from("User")
          .select("max_socios, acesso_expira_em")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user metadata:", error);
          return;
        }

        if (!data) {
          setMetadata({
            max_socios: null,
            acesso_expira_em: null,
            isExpired: false,
          });
          return;
        }

        const isExpired = data.acesso_expira_em 
          ? new Date(data.acesso_expira_em) < new Date() 
          : false;

        setMetadata({
          max_socios: data.max_socios,
          acesso_expira_em: data.acesso_expira_em,
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
