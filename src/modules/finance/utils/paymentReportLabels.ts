import type { PaymentByPeriod, PaymentType } from "../types/finance.types";

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  anuidade: "Anuidade",
  mensalidade: "Mensalidade",
  inicial: "Taxa inicial",
  transferencia: "Transferência",
  contribuicao: "Contribuição",
  cadastro_governamental: "Cadastro governamental",
};

export const PAYMENT_TYPE_FILTER_OPTIONS: Array<{
  value: PaymentType;
  label: string;
}> = [
  { value: "anuidade", label: "Anuidade" },
  { value: "mensalidade", label: "Mensalidade" },
  { value: "contribuicao", label: "Contribuição" },
  { value: "inicial", label: "Taxa inicial" },
  { value: "transferencia", label: "Transferência" },
  { value: "cadastro_governamental", label: "Cadastro governamental" },
];

export function getPaymentTypeLabel(tipo?: string | null) {
  if (!tipo) return "Sem tipo";
  return PAYMENT_TYPE_LABELS[tipo as PaymentType] ?? tipo.replaceAll("_", " ");
}

export function getPaymentCompetenciaLabel(payment: Pick<PaymentByPeriod, "tipo" | "competencia_ano" | "competencia_mes">) {
  if (payment.tipo === "mensalidade" && payment.competencia_ano && payment.competencia_mes) {
    return `${String(payment.competencia_mes).padStart(2, "0")}/${payment.competencia_ano}`;
  }

  if (payment.tipo === "anuidade" && payment.competencia_ano) {
    return String(payment.competencia_ano);
  }

  return "—";
}

