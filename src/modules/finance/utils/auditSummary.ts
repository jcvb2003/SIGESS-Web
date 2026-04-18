/**
 * Utilitário para transformar logs de auditoria técnica em resumos legíveis.
 */

interface AuditData {
  [key: string]: unknown;
}

const FIELD_LABELS: Record<string, string> = {
  valor: "Valor",
  descricao: "Descrição",
  forma_pagamento: "Forma de Pagamento",
  status: "Status",
  competencia_ano: "Ano",
  competencia_mes: "Mês",
  data_pagamento: "Data de Pagamento",
  regime_padrao: "Regime Padrão",
  dia_vencimento: "Dia de Vencimento",
  valor_anuidade: "Valor Anuidade",
  valor_mensalidade: "Valor Mensalidade",
};

const formatValue = (val: unknown): string => {
  if (val === null || val === undefined) return "vazio";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return JSON.stringify(val);
};

export function buildAuditSummary(
  operation: string,
  oldData: AuditData | null,
  newData: AuditData | null
): string {
  if (operation === "INSERT") {
    return "Criou novo registro.";
  }

  if (operation === "DELETE") {
    return "Removeu registro permanentemente.";
  }

  if (operation === "PURGE" || operation === "PURGE_BULK") {
    return "Excluiu registro do banco de dados definitivamente.";
  }

  if (operation === "CANCEL_PAYMENT") {
    const obsValue = newData?.obs;
    const obs = obsValue ? ` (Obs: ${formatValue(obsValue)})` : "";
    return `Cancelou o pagamento${obs}.`;
  }

  if (operation === "UPDATE" && oldData && newData) {
    const changes: string[] = [];

    Object.keys(newData).forEach((key) => {
      // Ignorar campos de timestamp ou técnicos que mudam sempre
      if (["updated_at", "created_at", "id"].includes(key)) return;

      const oldVal = oldData[key];
      const newVal = newData[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const label = FIELD_LABELS[key] || key;
        const oldStr = formatValue(oldVal);
        const newStr = formatValue(newVal);
        changes.push(`${label}: de "${oldStr}" para "${newStr}"`);
      }
    });

    return changes.length > 0 
      ? `Alterou campos: ${changes.join("; ")}.`
      : "Atualizou registro (sem mudanças nos campos principais).";
  }

  return "Operação realizada.";
}
