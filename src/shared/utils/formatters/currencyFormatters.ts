/**
 * Format a number as BRL currency. Always 2 decimal places (spec R30).
 * @example formatCurrency(50) → "R$ 50,00"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a raw number with 2 decimal places for input fields.
 * @example formatDecimal(50) → "50,00"
 */
export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value.toFixed(2).replace(".", ",");
}
