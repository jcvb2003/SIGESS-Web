import { requirementService } from "./requirementService";
import { RequirementStatus } from "../types/requirement.types";

export interface ReconciliationResult {
  portalName: string;
  portalNit: string;
  member?: {
    id: string;
    cpf: string | null;
    nome: string | null;
    nit: string | null;
    requerimentos: Array<{
      id: string;
      status_mte: RequirementStatus;
      beneficio_recebido: boolean;
      ano_referencia: number;
    }>;
  };
  matchType: 'FULL' | 'NIT_ONLY' | 'NAME_ONLY' | 'NONE';
  finance?: string;
  hasReqCurrentYear: boolean;
  selected: boolean;
  existingReqId?: string;
}

export type MemberFromIndex = Awaited<ReturnType<typeof requirementService.getReconciliationContext>>['members'][0];

export interface ReconciliationIndexes {
  nitMap: Map<string, MemberFromIndex>;
  nameMap: Map<string, MemberFromIndex>;
}

function getText(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return "";
}

/**
 * Constrói os mapas de busca para performance O(1)
 */
export function buildMemberIndexes(members: MemberFromIndex[]): ReconciliationIndexes {
  const nitMap = new Map<string, MemberFromIndex>();
  const nameMap = new Map<string, MemberFromIndex>();
  
  members.forEach(m => {
    if (m.nit) nitMap.set(String(m.nit).replaceAll(/\D/g, ""), m);
    if (m.nome) nameMap.set(requirementService.normalizeName(m.nome), m);
  });
  
  return { nitMap, nameMap };
}

/**
 * Tenta encontrar um sócio correspondente para uma linha do portal
 */
export function findMatchForPortalRow(
  portalName: string, 
  portalNit: string, 
  indexes: ReconciliationIndexes
): { member: MemberFromIndex | null, matchType: ReconciliationResult['matchType'] } {
  // 1. Tentar Match por NIT
  const matchedByNit = portalNit ? indexes.nitMap.get(portalNit) : null;
  if (matchedByNit) {
    const isFullMatch = matchedByNit.nome?.toUpperCase() === portalName.toUpperCase();
    return { member: matchedByNit, matchType: isFullMatch ? 'FULL' : 'NIT_ONLY' };
  }

  // 2. Fallback por Nome Normalizado
  const normalizedPortalName = requirementService.normalizeName(portalName);
  const matchedByName = indexes.nameMap.get(normalizedPortalName);
  
  return { 
    member: matchedByName || null, 
    matchType: matchedByName ? 'NAME_ONLY' : 'NONE' 
  };
}

/**
 * Executa a reconciliação de uma linha do CSV com o contexto do banco
 */
export function reconcileRow(
  row: Record<string, unknown>,
  context: Awaited<ReturnType<typeof requirementService.getReconciliationContext>>,
  indexes: ReconciliationIndexes,
  anoAtual: number
): ReconciliationResult | null {
  if (row["UF"] !== context.entityUf) return null;

  const pName = getText(row, ["NOME FAVORECIDO", "Nome", "NOME", "Beneficiário"]);
  const pNit = getText(row, ["NIS FAVORECIDO", "NIT", "PIS/PASEP"]).replaceAll(/\D/g, "");

  if (!pName && !pNit) return null;

  const { member, matchType } = findMatchForPortalRow(pName, pNit, indexes);

  if (!member) return null;

  const reqThisYear = member.requerimentos?.find(r => r.ano_referencia === anoAtual);
  
  // Se já recebeu, ignoramos no resultado de importação (evita duplicidade visual)
  if (reqThisYear?.beneficio_recebido) return null;

  return {
    portalName: pName,
    portalNit: pNit,
    member: member as ReconciliationResult['member'],
    matchType,
    finance: context.financeMap.get(member.cpf || "") ?? undefined,
    hasReqCurrentYear: !!reqThisYear,
    existingReqId: reqThisYear?.id,
    selected: (matchType === 'FULL' || matchType === 'NIT_ONLY') && !!reqThisYear
  };
}
