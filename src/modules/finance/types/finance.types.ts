import type { Tables, TablesInsert } from "@/shared/lib/supabase/database.types";

// ── DB Table Types (derived from database.types.ts — never redefine manually) ──
export type FinanceLancamento = Tables<"financeiro_lancamentos">;
export type FinanceLancamentoInsert = TablesInsert<"financeiro_lancamentos">;
export type FinanceDAE = Tables<"financeiro_dae">;
export type FinanceDAEInsert = TablesInsert<"financeiro_dae">;
export type FinanceConfig = Tables<"financeiro_config_socio">;
export type FinanceCharge = Tables<"financeiro_cobrancas_geradas">;
export type ChargeType = Tables<"tipos_cobranca">;
export type FinanceSettings = Tables<"parametros_financeiros">;
export type FinanceHistoricoRegime = Tables<"financeiro_historico_regime">;

// ── DB View Types ──
export type DebitoSocio = Tables<"v_debitos_socio">;
export type SituacaoFinanceiraSocio = Tables<"v_situacao_financeira_socio">;

// ── Domain Enums (match DB CHECK constraints exactly) ──
export type PaymentType =
  | "anuidade"
  | "mensalidade"
  | "inscricao"
  | "transferencia"
  | "contribuicao"
  | "cadastro_governamental";

export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "transferencia"
  | "boleto"
  | "cartao";

export type LancamentoStatus = "pago" | "cancelado";
export type ChargeStatus = "pendente" | "pago" | "cancelado";
export type FinancialRegime = "anuidade" | "mensalidade";
export type ChargeCategory = "contribuicao" | "cadastro_governamental";
export type ChargeObrigatoriedade = "compulsoria" | "facultativa";
export type BoletoType = "unitario" | "agrupado" | "anual";

// ── Derived / UI Types ──
export type FinancialStatusType =
  | "ok"
  | "overdue"
  | "exempt"
  | "released"
  | "alert";

export interface MemberFinancialSummary {
  cpf: string;
  nome: string;
  situacaoAssociativa: string;
  regime: FinancialRegime;
  isento: boolean;
  liberadoPresidente: boolean;
  anuidadesPagas: number[] | null;
  ultimoPagamento: string | null;
  status: FinancialStatusType;
  codigoSocio?: string | null;
  fotoUrl?: string | null;
}

export interface FinanceDashboardParams {
  page: number;
  pageSize: number;
  searchTerm: string;
  year: number;
  tab: "todos" | "em-dia" | "inadimplentes" | "liberados" | "isentos";
  filterAnnuityOk?: boolean;
  filterAnnuityOverdue?: boolean;
  filterDAEPaid?: boolean;
  filterDAEPending?: boolean;
  filterContributionPending?: boolean;
  filterGovRegistrationPending?: boolean;
  filterReleased?: boolean;
  filterExempt?: boolean;
}

export interface PaymentSessionPayload {
  sessaoId: string;
  socioCpf: string;
  items: PaymentSessionItem[];
  daes?: DAEItem[];
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD local — never UTC
}

export interface PaymentSessionItem {
  tipo: PaymentType;
  valor: number;
  competencia_ano?: number;
  competencia_mes?: number;
  tipo_cobranca_id?: string;
  descricao?: string;
}

export interface DAEItem {
  tipo_boleto: BoletoType;
  competencia_ano: number;
  competencia_mes: number;
  valor: number;
  grupo_id?: string;
}
