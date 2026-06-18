/** Regex do formato sugerido de código de sócio: MM0NNN (mês + zero + sequencial). */
export const REGISTRATION_CODE_PATTERN = /^\d{2}0\d{3}$/;

/** Retorna true se o código já está no formato sugerido (MM0NNN). */
export function isSuggestedMemberCode(code: string | undefined | null): boolean {
  return !!code && REGISTRATION_CODE_PATTERN.test(String(code));
}

/** Extrai o mês de uma data no formato YYYY-MM-DD. */
export function extractBirthMonth(birthdate: string): string {
  return birthdate.substring(5, 7);
}

/**
 * Calcula o próximo código sugerido a partir do último código conhecido.
 * Puro: sem chamada a serviço, sem acesso a formulário.
 */
export function buildSuggestedCode(prefix: string, lastCode: string | null): string {
  let sequence = 1;
  if (lastCode?.startsWith(prefix)) {
    sequence = parseInt(lastCode.substring(3) ?? "0", 10) + 1;
  }
  return `${prefix}${sequence.toString().padStart(3, "0")}`;
}
