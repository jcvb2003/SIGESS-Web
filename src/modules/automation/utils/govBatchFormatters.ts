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
