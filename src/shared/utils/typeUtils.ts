/**
 * Verifica se um valor não é nulo ou indefinido.
 * Útil para `Array.filter(isNotNullOrUndefined)` preservando o tipo.
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Garante que uma string vazia seja convertida para nulo.
 */
export function emptyToNull(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value;
}

/**
 * Type guard genérico para verificar chaves em objetos desconhecidos de forma segura.
 */
export function hasKey<O extends object, K extends PropertyKey>(
  obj: O,
  key: K
): obj is O & Record<K, unknown> {
  return key in obj;
}
