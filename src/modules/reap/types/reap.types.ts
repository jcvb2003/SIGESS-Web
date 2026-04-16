export interface ReapAnoSimplificado {
  enviado: boolean;
  tem_problema: boolean;
  obs: string | null;
}

export interface ReapAnoAnual {
  enviado: boolean;
  data_envio: string | null;
  tem_problema: boolean;
  obs: string | null;
}

export interface Reap {
  cpf: string;
  simplificado: Record<string, ReapAnoSimplificado>;
  anual: Record<string, ReapAnoAnual>;
  observacoes: string | null;
  updated_at: string;
}

export interface ReapWithMember extends Reap {
  member_nome: string | null;
  emissao_rgp: string | null;
}

export const ANOS_SIMPLIFICADO = [2021, 2022, 2023, 2024] as const;
export const ANO_INICIAL_ANUAL = 2025;
export const ANO_ATUAL = new Date().getFullYear();
