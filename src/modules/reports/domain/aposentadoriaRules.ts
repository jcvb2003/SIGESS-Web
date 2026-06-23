export const RETIREMENT_AGE: Record<string, number> = {
  MASCULINO: 60,
  FEMININO: 55,
};

// Parse seguro de YYYY-MM-DD sem risco de timezone shift
function parseDateParts(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getAgeYears(birthDate: string): number {
  const today = new Date();
  const birth = parseDateParts(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Regras:
// - sexo desconhecido → null (não inventar elegibilidade)
// - aniversário hoje → apto (não "em breve")
// - "em breve": completa a idade NESTE ano civil E aniversário ainda não passou
export function getAposentadoriaCategory(
  birthDate: string | null,
  sexo: string | null,
  situacao: string | null,
): 'aposentado' | 'apto' | 'em_breve' | null {
  if (situacao === 'APOSENTADO') return 'aposentado';
  if (!birthDate || !sexo) return null;

  const retAge = RETIREMENT_AGE[sexo];
  if (retAge === undefined) return null; // sexo desconhecido

  const age = getAgeYears(birthDate);
  if (age >= retAge) return 'apto'; // inclui quem faz aniversário hoje

  const today = new Date();
  const birth = parseDateParts(birthDate);
  const retirementYear = birth.getFullYear() + retAge;
  if (retirementYear !== today.getFullYear()) return null;

  const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  return birthdayThisYear > today ? 'em_breve' : 'apto';
}
