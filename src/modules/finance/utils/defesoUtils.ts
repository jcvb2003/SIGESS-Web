import { SystemParameters } from "../../settings/types/settings.types";

/**
 * Verifica se um determinado mês/ano está dentro de algum período de defeso.
 * Considera sobreposição: se qualquer dia do mês estiver no intervalo de defeso, o mês é bloqueado.
 * 
 * @param month Mês (1-12)
 * @param year Ano (YYYY)
 * @param parameters Parâmetros do sistema contendo os períodos
 */
export function isMonthInDefeso(
  month: number,
  year: number,
  parameters: SystemParameters | null | undefined
): boolean {
  if (!parameters) return false;

  // Início e fim do mês de competência
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const periods = [
    { start: parameters.defeso1Start, end: parameters.defeso1End },
    { start: parameters.defeso2Start, end: parameters.defeso2End },
  ];

  return periods.some((p) => {
    if (!p.start || !p.end) return false;

    // Converte strings "YYYY-MM-DD" para Date considerando o início/fim do dia
    const defesoStart = new Date(`${p.start}T00:00:00`);
    const defesoEnd = new Date(`${p.end}T23:59:59`);

    // Condição de sobreposição de intervalos:
    // (InícioA <= FimB) && (FimA >= InícioB)
    return monthStart <= defesoEnd && monthEnd >= defesoStart;
  });
}
