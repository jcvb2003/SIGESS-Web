export type RequirementStatus = 'assinado' | 'analise' | 'recurso_acerto' | 'deferido' | 'indeferido' | 'nao_assinado';

export interface Requirement {
  id: string;
  cod_req: string | null;
  data_assinatura: string | null;
  cpf: string | null;
  ano_referencia: number;
  status_mte: RequirementStatus;
  data_envio: string | null;
  num_req_mte: string | null;
  beneficio_recebido: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RequirementWithMember extends Requirement {
  member_nome?: string | null;
  member_nit?: string | null;
  member_num_rgp?: string | null;
  member_emissao_rgp?: string | null;
  situacao_financeira?: 'em_dia' | 'atraso' | 'isento';
}

export interface ListRequirementsExtendedArgs {
  p_ano: number;
  p_status: RequirementStatus | "all";
  p_beneficio: "all" | "recebido" | "pendente";
  p_search: string;
  p_carencia: string;
  p_page: number;
  p_page_size: number;
  p_unit_id?: string | null;
  p_tenant_id?: string | null;
}

export type ExtendedRequirementRow = Partial<Requirement> & {
  cpf: string | null;
  socio_id?: string | null;
  socio_nome?: string | null;
  socio_nit?: string | null;
  socio_num_rgp?: string | null;
  socio_emissao_rgp?: string | null;
  total_count?: number | string | null;
};

export type RequirementsRpcClient = {
  rpc: (
    fn: "list_requirements_extended",
    args: ListRequirementsExtendedArgs,
    options?: { count?: "exact" },
  ) => Promise<{ data: ExtendedRequirementRow[] | null; error: unknown }>;
};
