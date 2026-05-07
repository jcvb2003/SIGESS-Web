/**
 * Utilitários para manipulação de texto no SIGESS
 */

/**
 * Normaliza um nome para comparação:
 * - Remove acentos (NFD)
 * - Remove caracteres especiais
 * - Converte para Maiúsculas
 * - Remove espaços extras
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  
  return name
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}
