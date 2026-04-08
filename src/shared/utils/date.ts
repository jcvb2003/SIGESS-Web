/**
 * SIGESS Shared Utilities: Date Formatting
 * 
 * Centraliza a lógica de formatação de datas ISO para o padrão brasileiro (dd/mm/aaaa).
 * Garante consistência visual e evita divergências silenciosas em Dashboards e Relatórios.
 */

/**
 * Formata uma data ISO (string | null | undefined) para o formato brasileiro.
 * Retorna uma string vazia ("") caso a data não exista ou seja inválida.
 * Ideal para uso em componentes onde campos vazios são tratados.
 * 
 * @param date - String de data ISO ou valor nulo/indefinido
 * @returns string - Data formatada (pt-BR) ou ""
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      console.warn(`[SIGESS:Date] Data inválida recebida: ${date}`);
      return "";
    }
    return d.toLocaleDateString("pt-BR");
  } catch (err) {
    console.error("[SIGESS:Date] Erro ao formatar data:", err);
    return "";
  }
}

/**
 * Formata uma data ISO e retorna um hífen ("-") caso o valor seja nulo/vazio.
 * Recomendado para exibição em tabelas e listas detalhadas para evitar células vazias.
 * 
 * @param date - String de data ISO
 * @returns string - Data formatada (pt-BR) ou "-"
 */
export function formatDateOrDash(date: string | null | undefined): string {
  const formatted = formatDate(date);
  return formatted || "-";
}
