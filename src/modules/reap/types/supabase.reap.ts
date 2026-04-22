import { supabase as originalSupabase } from "@/shared/lib/supabase/client";
import type { Database } from "@/shared/lib/supabase/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

// Extend the auto-generated Database type with the reap table and RPCs
export type ReapDatabase = Database & {
  public: {
    Tables: Database["public"]["Tables"] & {
      reap: {
        Row: {
          anual: any | null;
          cpf: string;
          observacoes: string | null;
          simplificado: any | null;
          updated_at: string | null;
        };
        Insert: {
          anual?: any | null;
          cpf: string;
          observacoes?: string | null;
          simplificado?: any | null;
          updated_at?: string | null;
        };
        Update: {
          anual?: any | null;
          cpf?: string;
          observacoes?: string | null;
          simplificado?: any | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reap_cpf_fkey";
            columns: ["cpf"];
            isOneToOne: true;
            referencedRelation: "socios";
            referencedColumns: ["cpf"];
          }
        ];
      };
    };
    Functions: Database["public"]["Functions"] & {
      reap_upsert_simplificado_ano: {
        Args: {
          p_cpf: string;
          p_ano: string;
          p_data: any;
        };
        Returns: undefined;
      };
      reap_upsert_anual_ano: {
        Args: {
          p_cpf: string;
          p_ano: string;
          p_data: any;
        };
        Returns: undefined;
      };
      reap_upsert_full: {
        Args: {
          p_cpf: string;
          p_simplificado: any;
          p_anual: any;
          p_observacoes: string | null;
        };
        Returns: undefined;
      };
      reap_batch_upsert_simplificado: {
        Args: {
          p_entries: any;
        };
        Returns: undefined;
      };
    };
  };
};

export const supabaseReap = originalSupabase as unknown as SupabaseClient<ReapDatabase>;
