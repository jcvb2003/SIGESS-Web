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
          cor_primaria: string | null
          cor_secundaria: string | null
          cor_sidebar: string | null
          cpf_do_presidente: string | null
          email: string | null
          endereco: string | null
          federacao: string | null
          fone: string | null
          fundacao: string | null
          id: string
          nome_abreviado: string | null
          nome_do_presidente: string | null
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
          cor_primaria?: string | null
          cor_secundaria?: string | null
          cor_sidebar?: string | null
          cpf_do_presidente?: string | null
          email?: string | null
          endereco?: string | null
          federacao?: string | null
          fone?: string | null
          fundacao?: string | null
          id?: string
          nome_abreviado?: string | null
          nome_do_presidente?: string | null
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
          cor_primaria?: string | null
          cor_secundaria?: string | null
          cor_sidebar?: string | null
          cpf_do_presidente?: string | null
          email?: string | null
          endereco?: string | null
          federacao?: string | null
          fone?: string | null
          fundacao?: string | null
          id?: string
          nome_abreviado?: string | null
          nome_do_presidente?: string | null
          nome_entidade?: string | null
          numero?: string | null
          polo?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      financeiro_cobrancas_geradas: {
        Row: {
          cancelado_em: string | null
          cancelado_por: string | null
          cancelamento_obs: string | null
          created_at: string | null
          data_lancamento: string
          data_vencimento: string | null
          id: string
          lancamento_id: string | null
          socio_cpf: string
          status: string
          tipo_cobranca_id: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelamento_obs?: string | null
          created_at?: string | null
          data_lancamento?: string
          data_vencimento?: string | null
          id?: string
          lancamento_id?: string | null
          socio_cpf: string
          status?: string
          tipo_cobranca_id: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelamento_obs?: string | null
          created_at?: string | null
          data_lancamento?: string
          data_vencimento?: string | null
          id?: string
          lancamento_id?: string | null
          socio_cpf?: string
          status?: string
          tipo_cobranca_id?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_cobrancas_geradas_cancelado_por_fkey"
            columns: ["cancelado_por"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_geradas_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "financeiro_lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_geradas_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_geradas_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_geradas_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_situacao_financeira_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_geradas_tipo_cobranca_id_fkey"
            columns: ["tipo_cobranca_id"]
            isOneToOne: false
            referencedRelation: "tipos_cobranca"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_config_socio: {
        Row: {
          cpf: string
          created_at: string | null
          dia_vencimento: number | null
          isento: boolean
          liberacao_data: string | null
          liberacao_observacao: string | null
          liberacao_usuario_id: string | null
          liberado_pelo_presidente: boolean
          motivo_isencao: string | null
          referencia_vencimento: string | null
          regime: string | null
          updated_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          dia_vencimento?: number | null
          isento?: boolean
          liberacao_data?: string | null
          liberacao_observacao?: string | null
          liberacao_usuario_id?: string | null
          liberado_pelo_presidente?: boolean
          motivo_isencao?: string | null
          referencia_vencimento?: string | null
          regime?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          dia_vencimento?: number | null
          isento?: boolean
          liberacao_data?: string | null
          liberacao_observacao?: string | null
          liberacao_usuario_id?: string | null
          liberado_pelo_presidente?: boolean
          motivo_isencao?: string | null
          referencia_vencimento?: string | null
          regime?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_config_socio_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_config_socio_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_config_socio_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "v_situacao_financeira_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_config_socio_liberacao_usuario_id_fkey"
            columns: ["liberacao_usuario_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_dae: {
        Row: {
          boleto_pago: boolean
          competencia_ano: number
          competencia_mes: number
          created_at: string | null
          data_pagamento_boleto: string | null
          data_recebimento: string
          forma_pagamento: string
          grupo_id: string | null
          id: string
          registrado_por: string | null
          sessao_id: string | null
          socio_cpf: string
          status: string
          tipo_boleto: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          boleto_pago?: boolean
          competencia_ano: number
          competencia_mes: number
          created_at?: string | null
          data_pagamento_boleto?: string | null
          data_recebimento?: string
          forma_pagamento: string
          grupo_id?: string | null
          id?: string
          registrado_por?: string | null
          sessao_id?: string | null
          socio_cpf: string
          status?: string
          tipo_boleto: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          boleto_pago?: boolean
          competencia_ano?: number
          competencia_mes?: number
          created_at?: string | null
          data_pagamento_boleto?: string | null
          data_recebimento?: string
          forma_pagamento?: string
          grupo_id?: string | null
          id?: string
          registrado_por?: string | null
          sessao_id?: string | null
          socio_cpf?: string
          status?: string
          tipo_boleto?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_dae_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_dae_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_dae_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_dae_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_situacao_financeira_socio"
            referencedColumns: ["cpf"]
          },
        ]
      }
      financeiro_historico_regime: {
        Row: {
          alterado_por: string | null
          created_at: string | null
          id: string
          observacao: string | null
          regime: string
          socio_cpf: string
          vigente_ate: string | null
          vigente_desde: string
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string | null
          id?: string
          observacao?: string | null
          regime: string
          socio_cpf: string
          vigente_ate?: string | null
          vigente_desde: string
        }
        Update: {
          alterado_por?: string | null
          created_at?: string | null
          id?: string
          observacao?: string | null
          regime?: string
          socio_cpf?: string
          vigente_ate?: string | null
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_historico_regime_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_historico_regime_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_historico_regime_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_historico_regime_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_situacao_financeira_socio"
            referencedColumns: ["cpf"]
          },
        ]
      }
      financeiro_lancamentos: {
        Row: {
          cancelado_em: string | null
          cancelado_por: string | null
          cancelamento_obs: string | null
          competencia_ano: number | null
          competencia_mes: number | null
          created_at: string | null
          data_pagamento: string
          descricao: string | null
          forma_pagamento: string
          id: string
          registrado_por: string | null
          sessao_id: string
          socio_cpf: string
          status: string
          tipo: string
          tipo_cobranca_id: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelamento_obs?: string | null
          competencia_ano?: number | null
          competencia_mes?: number | null
          created_at?: string | null
          data_pagamento?: string
          descricao?: string | null
          forma_pagamento: string
          id?: string
          registrado_por?: string | null
          sessao_id?: string
          socio_cpf: string
          status?: string
          tipo: string
          tipo_cobranca_id?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          cancelado_em?: string | null
          cancelado_por?: string | null
          cancelamento_obs?: string | null
          competencia_ano?: number | null
          competencia_mes?: number | null
          created_at?: string | null
          data_pagamento?: string
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          registrado_por?: string | null
          sessao_id?: string
          socio_cpf?: string
          status?: string
          tipo?: string
          tipo_cobranca_id?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lancamentos_cancelado_por_fkey"
            columns: ["cancelado_por"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_socio_cpf_fkey"
            columns: ["socio_cpf"]
            isOneToOne: false
            referencedRelation: "v_situacao_financeira_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_tipo_cobranca_id_fkey"
            columns: ["tipo_cobranca_id"]
            isOneToOne: false
            referencedRelation: "tipos_cobranca"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          cpf: string
          foto_url: string | null
        }
        Insert: {
          cpf: string
          foto_url?: string | null
        }
        Update: {
          cpf?: string
          foto_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fotos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "fotos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "fotos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: true
            referencedRelation: "v_situacao_financeira_socio"
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
      parametros_financeiros: {
        Row: {
          ano_base_cobranca: number
          anos_atraso_alerta: number
          bloquear_inadimplente: boolean
          cobra_juros: boolean | null
          cobra_multa: boolean | null
          created_at: string | null
          dia_vencimento: number
          id: string
          percentual_juros_mes: number | null
          percentual_multa: number | null
          regime_padrao: string
          updated_at: string | null
          valor_anuidade: number | null
          valor_inscricao: number | null
          valor_mensalidade: number | null
          valor_transferencia: number | null
        }
        Insert: {
          ano_base_cobranca?: number
          anos_atraso_alerta?: number
          bloquear_inadimplente?: boolean
          cobra_juros?: boolean | null
          cobra_multa?: boolean | null
          created_at?: string | null
          dia_vencimento?: number
          id?: string
          percentual_juros_mes?: number | null
          percentual_multa?: number | null
          regime_padrao?: string
          updated_at?: string | null
          valor_anuidade?: number | null
          valor_inscricao?: number | null
          valor_mensalidade?: number | null
          valor_transferencia?: number | null
        }
        Update: {
          ano_base_cobranca?: number
          anos_atraso_alerta?: number
          bloquear_inadimplente?: boolean
          cobra_juros?: boolean | null
          cobra_multa?: boolean | null
          created_at?: string | null
          dia_vencimento?: number
          id?: string
          percentual_juros_mes?: number | null
          percentual_multa?: number | null
          regime_padrao?: string
          updated_at?: string | null
          valor_anuidade?: number | null
          valor_inscricao?: number | null
          valor_mensalidade?: number | null
          valor_transferencia?: number | null
        }
        Relationships: []
      }
      requerimentos: {
        Row: {
          cod_req: string | null
          cpf: string | null
          data: string | null
          id: string
        }
        Insert: {
          cod_req?: string | null
          cpf?: string | null
          data?: string | null
          id?: string
        }
        Update: {
          cod_req?: string | null
          cpf?: string | null
          data?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requerimentos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "requerimentos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: false
            referencedRelation: "v_debitos_socio"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "requerimentos_cpf_fkey"
            columns: ["cpf"]
            isOneToOne: false
            referencedRelation: "v_situacao_financeira_socio"
            referencedColumns: ["cpf"]
          },
        ]
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
          cpf: string | null
          data_de_admissao: string | null
          data_de_nascimento: string | null
          dt_expedicao_rg: string | null
          email: string | null
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
          num_rgp: string | null
          observacoes: string | null
          pai: string | null
          rg: string | null
          rgp_uf: string | null
          secao: string | null
          senhagov_inss: string | null
          sexo: string | null
          situacao: string | null
          uf_rg: string | null
          telefone: string | null
          tipo_rgp: string | null
          titulo: string | null
          uf: string | null
          uf_naturalidade: string | null
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
          cpf?: string | null
          data_de_admissao?: string | null
          data_de_nascimento?: string | null
          dt_expedicao_rg?: string | null
          email?: string | null
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
          num_rgp?: string | null
          observacoes?: string | null
          pai?: string | null
          rg?: string | null
          rgp_uf?: string | null
          secao?: string | null
          senhagov_inss?: string | null
          sexo?: string | null
          situacao?: string | null
          uf_rg?: string | null
          telefone?: string | null
          tipo_rgp?: string | null
          titulo?: string | null
          uf?: string | null
          uf_naturalidade?: string | null
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
          cpf?: string | null
          data_de_admissao?: string | null
          data_de_nascimento?: string | null
          dt_expedicao_rg?: string | null
          email?: string | null
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
          num_rgp?: string | null
          observacoes?: string | null
          pai?: string | null
          rg?: string | null
          rgp_uf?: string | null
          secao?: string | null
          senhagov_inss?: string | null
          sexo?: string | null
          situacao?: string | null
          uf_rg?: string | null
          telefone?: string | null
          tipo_rgp?: string | null
          titulo?: string | null
          uf?: string | null
          uf_naturalidade?: string | null
          zona?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          content_type: string | null
          created_at: string | null
          document_type: string | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          font_configurations: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          font_configurations?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          font_configurations?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipos_cobranca: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          obrigatoriedade: string | null
          updated_at: string | null
          valor_padrao: number | null
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          obrigatoriedade?: string | null
          updated_at?: string | null
          valor_padrao?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          obrigatoriedade?: string | null
          updated_at?: string | null
          valor_padrao?: number | null
        }
        Relationships: []
      }
      User: {
        Row: {
          acesso_expira_em: string | null
          createdAt: string | null
          email: string | null
          id: string
          max_socios: number | null
          role: string | null
        }
        Insert: {
          acesso_expira_em?: string | null
          createdAt?: string | null
          email?: string | null
          id: string
          max_socios?: number | null
          role?: string | null
        }
        Update: {
          acesso_expira_em?: string | null
          createdAt?: string | null
          email?: string | null
          id?: string
          max_socios?: number | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_debitos_socio: {
        Row: {
          ano: number | null
          anuidade_pendente: boolean | null
          cpf: string | null
          isento: boolean | null
          liberado: boolean | null
          nome: string | null
        }
        Relationships: []
      }
      v_situacao_financeira_socio: {
        Row: {
          anuidades_pagas: number[] | null
          cpf: string | null
          isento: boolean | null
          liberado_presidente: boolean | null
          nome: string | null
          regime: string | null
          situacao_associativa: string | null
          ultimo_pagamento: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_next_cod_req: { Args: never; Returns: string }
      launch_bulk_contribution: {
        Args: { p_tipo_cobranca_id: string }
        Returns: number
      }
      register_payment_session: {
        Args: {
          p_daes?: Json
          p_data_pagamento: string
          p_forma_pagamento: string
          p_itens: Json
          p_sessao_id: string
          p_socio_cpf: string
        }
        Returns: undefined
      }
      socio_inadimplente_ano: {
        Args: { p_ano: number; p_cpf: string }
        Returns: boolean
      }
      update_member_regime: {
        Args: { p_cpf: string; p_novo_regime: string; p_observacao?: string }
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
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
  PublicCompositeTypeNameOrOptions extends
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
