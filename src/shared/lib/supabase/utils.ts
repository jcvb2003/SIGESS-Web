

/**
 * Utilitários para facilitar o uso do Supabase no SIGESS
 */

/**
 * Executa uma query de forma exaustiva, percorrendo todas as páginas
 * de 1000 registros até obter o resultado completo.
 * Útil para carregar bases para processamento em memória (Reconciliação/Relatórios).
 */
export async function fetchAll<T>(
  queryBuilder: any,
  pageSize = 1000
): Promise<T[]> {
  const allData: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await queryBuilder.range(from, from + pageSize - 1);

    if (error) {
      console.error("Error in fetchAll:", error);
      throw error;
    }

    if (!data || data.length === 0) break;

    allData.push(...data);
    
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
}
