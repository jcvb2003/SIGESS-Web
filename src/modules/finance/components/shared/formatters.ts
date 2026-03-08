/**
 * Formata número enquanto digita (Estilo Progressivo).
 * Exemplo: 1 -> 0,01 | 12 -> 0,12 | 125 -> 1,25
 */
export const formatNumericInput = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
