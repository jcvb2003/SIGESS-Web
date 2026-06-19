export function getRequiredYears(anoBase: number, currentYear: number): number[] {
  const years: number[] = [];
  for (let y = anoBase; y <= currentYear; y++) years.push(y);
  return years;
}
