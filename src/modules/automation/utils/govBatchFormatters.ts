export function formatConfiguredCurrency(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^R\$\s*/i.test(trimmed)) return trimmed;
  return `R$ ${trimmed}`;
}

export function formatBoletoCurrency(value?: number): string | null {
  if (value == null) return null;

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseGovCompetencia(
  competencia?: string,
): { year: number; month: number } | null {
  const match = (competencia || "").trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}
