export type RequirementStatus = 'assinado' | 'analise' | 'recurso_acerto' | 'deferido' | 'indeferido';

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
  situacao_financeira?: 'em_dia' | 'atraso' | 'isento';
}

