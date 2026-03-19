export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      entidade: {
        Row: {
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          comarca: string | null
          confederacao: string | null
          email: string | null
          endereco: string | null
          federacao: string | null
          fone: string | null
          fundacao: string | null
          id: string
          nome_abreviado: string | null
          nome_entidade: string | null
          numero: string | null
          polo: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          comarca?: string | null
          confederacao?: string | null
          email?: string | null
          endereco?: string | null
          federacao?: string | null
          fone?: string | null
          fundacao?: string | null
          id?: string
          nome_abreviado?: string | null
          nome_entidade?: string | null
          numero?: string | null
          polo?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          comarca?: string | null
          confederacao?: string | null
          email?: string | null
          endereco?: string | null
          federacao?: string | null
          fone?: string | null
          fundacao?: string | null
          id?: string
          nome_abreviado?: string | null
          nome_entidade?: string | null
          numero?: string | null
          polo?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      fotos: {
        Row: {
          cpf: string
          foto_url: string
        }
        Insert: {
          cpf: string
          foto_url: string
        }
        Update: {
          cpf?: string
          foto_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
        ]
      }
      localidades: {
        Row: {
          codigo_localidade: string | null
          id: string
          nome: string | null
        }
        Insert: {
          codigo_localidade?: string | null
          id?: string
          nome?: string | null
        }
        Update: {
          codigo_localidade?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      parametros: {
        Row: {
          data_publicacao: string | null
          especies_proibidas: string | null
          final_pesca1: string | null
          final_pesca2: string | null
          id: string
          inicio_pesca1: string | null
          inicio_pesca2: string | null
          local_pesca: string | null
          localpesca: string | null
          nr_publicacao: string | null
        }
        Insert: {
          data_publicacao?: string | null
          especies_proibidas?: string | null
          final_pesca1?: string | null
          final_pesca2?: string | null
          id?: string
          inicio_pesca1?: string | null
          inicio_pesca2?: string | null
          local_pesca?: string | null
          localpesca?: string | null
          nr_publicacao?: string | null
        }
        Update: {
          data_publicacao?: string | null
          especies_proibidas?: string | null
          final_pesca1?: string | null
          final_pesca2?: string | null
          id?: string
          inicio_pesca1?: string | null
          inicio_pesca2?: string | null
          local_pesca?: string | null
          localpesca?: string | null
          nr_publicacao?: string | null
        }
        Relationships: []
      }
      requerimentos: {
        Row: {
          area: string | null
          bairro: string | null
          cei: string | null
          cep: string | null
          cidade: string | null
          cod_req_inss: string
          codigo_do_socio: string | null
          cpf: string | null
          data: string | null
          dtnasc: string | null
          dtpub: string | null
          emb_rgp: string | null
          endereco: string | null
          especie_proibidas: string | null
          fim1: string | null
          fim2: string | null
          id: string
          inicio1: string | null
          inicio2: string | null
          mae: string | null
          nit: string | null
          nome: string | null
          nrpub: string | null
          num: string | null
          pis: string | null
          rg: string | null
          rgp_uf: string | null
          situacao_mpa: string | null
          telefone: string | null
          uf: string | null
        }
        Insert: {
          area?: string | null
          bairro?: string | null
          cei?: string | null
          cep?: string | null
          cidade?: string | null
          cod_req_inss?: string
          codigo_do_socio?: string | null
          cpf?: string | null
          data?: string | null
          dtnasc?: string | null
          dtpub?: string | null
          emb_rgp?: string | null
          endereco?: string | null
          especie_proibidas?: string | null
          fim1?: string | null
          fim2?: string | null
          id?: string
          inicio1?: string | null
          inicio2?: string | null
          mae?: string | null
          nit?: string | null
          nome?: string | null
          nrpub?: string | null
          num?: string | null
          pis?: string | null
          rg?: string | null
          rgp_uf?: string | null
          situacao_mpa?: string | null
          telefone?: string | null
          uf?: string | null
        }
        Update: {
          area?: string | null
          bairro?: string | null
          cei?: string | null
          cep?: string | null
          cidade?: string | null
          cod_req_inss?: string
          codigo_do_socio?: string | null
          cpf?: string | null
          data?: string | null
          dtnasc?: string | null
          dtpub?: string | null
          emb_rgp?: string | null
          endereco?: string | null
          especie_proibidas?: string | null
          fim1?: string | null
          fim2?: string | null
          id?: string
          inicio1?: string | null
          inicio2?: string | null
          mae?: string | null
          nit?: string | null
          nome?: string | null
          nrpub?: string | null
          num?: string | null
          pis?: string | null
          rg?: string | null
          rgp_uf?: string | null
          situacao_mpa?: string | null
          telefone?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      socios: {
        Row: {
          alfabetizado: string | null
          apelido: string | null
          bairro: string | null
          caepf: string | null
          cei: string | null
          cep: string | null
          cidade: string | null
          codigo_do_socio: string | null
          codigo_localidade: string | null
          cpf: string
          data_de_admissao: string | null
          data_de_nascimento: string | null
          dt_expedicao_rg: string | null
          email: string | null
          emb_rgp: string | null
          emissao_rgp: string | null
          endereco: string | null
          escolaridade: string | null
          estado_civil: string | null
          id: string
          mae: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nit: string | null
          nome: string | null
          num: string | null
          observacoes: string | null
          pai: string | null
          rg: string | null
          rgp_uf: string | null
          secao: string | null
          senhagov_inss: string | null
          sexo: string | null
          situacao: string | null
          ssp: string | null
          telefone: string | null
          titulo: string | null
          uf: string | null
          uf_naturalidade: string | null
          user_id: string | null
          zona: string | null
        }
        Insert: {
          alfabetizado?: string | null
          apelido?: string | null
          bairro?: string | null
          caepf?: string | null
          cei?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_do_socio?: string | null
          codigo_localidade?: string | null
          cpf: string
          data_de_admissao?: string | null
          data_de_nascimento?: string | null
          dt_expedicao_rg?: string | null
          email?: string | null
          emb_rgp?: string | null
          emissao_rgp?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          id?: string
          mae?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nit?: string | null
          nome?: string | null
          num?: string | null
          observacoes?: string | null
          pai?: string | null
          rg?: string | null
          rgp_uf?: string | null
          secao?: string | null
          senhagov_inss?: string | null
          sexo?: string | null
          situacao?: string | null
          ssp?: string | null
          telefone?: string | null
          titulo?: string | null
          uf?: string | null
          uf_naturalidade?: string | null
          user_id?: string | null
          zona?: string | null
        }
        Update: {
          alfabetizado?: string | null
          apelido?: string | null
          bairro?: string | null
          caepf?: string | null
          cei?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_do_socio?: string | null
          codigo_localidade?: string | null
          cpf?: string
          data_de_admissao?: string | null
          data_de_nascimento?: string | null
          dt_expedicao_rg?: string | null
          email?: string | null
          emb_rgp?: string | null
          emissao_rgp?: string | null
          endereco?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          id?: string
          mae?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nit?: string | null
          nome?: string | null
          num?: string | null
          observacoes?: string | null
          pai?: string | null
          rg?: string | null
          rgp_uf?: string | null
          secao?: string | null
          senhagov_inss?: string | null
          sexo?: string | null
          situacao?: string | null
          ssp?: string | null
          telefone?: string | null
          titulo?: string | null
          uf?: string | null
          uf_naturalidade?: string | null
          user_id?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          content_type: string
          created_at: string | null
          document_type: string
          file_path: string
          file_size: number
          file_url: string
          font_configurations: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          document_type: string
          file_path: string
          file_size: number
          file_url: string
          font_configurations?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          document_type?: string
          file_path?: string
          file_size?: number
          file_url?: string
          font_configurations?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      User: {
        Row: {
          acesso_expira_em: string | null
          createdAt: string
          email: string
          id: string
          max_socios: number | null
          role: string
        }
        Insert: {
          acesso_expira_em?: string | null
          createdAt?: string
          email: string
          id: string
          max_socios?: number | null
          role?: string
        }
        Update: {
          acesso_expira_em?: string | null
          createdAt?: string
          email?: string
          id?: string
          max_socios?: number | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      export_table_data: {
        Args: { schema_name: string; table_name: string }
        Returns: Json
      }
      get_next_cod_req_inss: { Args: never; Returns: string }
      restore_table_from_backup: {
        Args: {
          backup_table_var: string
          pk_column: string
          table_name_var: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends [keyof DefaultSchema["Enums"]] extends [
    never,
  ]
    ? { schema: keyof DatabaseWithoutInternals }
    : keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends [
    keyof DefaultSchema["CompositeTypes"],
  ] extends [never]
    ? { schema: keyof DatabaseWithoutInternals }
    :
        | keyof DefaultSchema["CompositeTypes"]
        | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
