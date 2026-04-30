import type {
  PaymentMethod,
  PaymentType,
  BoletoType,
} from "../../types/finance.types";

// ── Formas de Pagamento ──
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro (espécie)" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência bancária" },
  { value: "boleto", label: "Boleto bancário" },
  { value: "cartao", label: "Cartão débito/crédito" },
];

// ── Tipos de Boleto DAE ──
export const BOLETO_TYPES: {
  value: BoletoType;
  label: string;
  description: string;
}[] = [
  {
    value: "unitario",
    label: "Unitário (1 competência)",
    description: "Uma única competência",
  },
  {
    value: "agrupado",
    label: "Agrupado (2+ competências)",
    description: "Múltiplas competências selecionadas",
  },
  {
    value: "anual",
    label: "Anual (12 competências)",
    description: "Todas as 12 competências do ano",
  },
];

// ── Tipos de Taxa/Lançamento Extra ──
export const FEE_TYPES: {
  value: PaymentType;
  label: string;
}[] = [
  { value: "inicial", label: "Inicial" },
  { value: "transferencia", label: "Transferência" },
  { value: "contribuicao", label: "Contribuição" },
  { value: "cadastro_governamental", label: "Cadastro" },
];

// ── Dicionários de Exibição (Labels) ──
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  transferencia: "Transferência",
  boleto: "Boleto",
  cartao: "Cartão",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  anuidade: "Anuidade",
  mensalidade: "Mensalidade",
  inicial: "Inicial",
  transferencia: "Transferência",
  contribuicao: "Contribuição",
  cadastro_governamental: "Cadastro Governamental",
};
