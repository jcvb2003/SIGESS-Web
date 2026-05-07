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
  const maskedCpfMap = new Map<string, MemberFromIndex>();
  
  members.forEach(m => {
    if (m.nit) nitMap.set(String(m.nit).replaceAll(/\D/g, ""), m);
    
    if (m.nome) {
      const normalized = requirementService.normalizeName(m.nome);
      nameMap.set(normalized, m);
      
      // Criar chave Nome + CPF Mascarado (***.933.442-**)
      if (m.cpf) {
        const cleanCpf = m.cpf.replaceAll(/\D/g, "");
        if (cleanCpf.length === 11) {
          const masked = `***.${cleanCpf.substring(3, 6)}.${cleanCpf.substring(6, 9)}-**`;
          maskedCpfMap.set(`${normalized}|${masked}`, m);
        }
      }
    }
  });
  
  return { nitMap, nameMap, maskedCpfMap };
}

export interface ReconciliationIndexes {
  nitMap: Map<string, MemberFromIndex>;
  nameMap: Map<string, MemberFromIndex>;
  maskedCpfMap: Map<string, MemberFromIndex>;
}

/**
 * Tenta encontrar um sócio correspondente para uma linha do portal
 */
export function findMatchForPortalRow(
  portalName: string, 
  portalNit: string, 
  portalCpf: string,
  indexes: ReconciliationIndexes
): { member: MemberFromIndex | null, matchType: ReconciliationResult['matchType'] } {
  const normalizedPortalName = requirementService.normalizeName(portalName);

  // 1. Tentar Match por NIT (Alta Confiança)
  const matchedByNit = portalNit ? indexes.nitMap.get(portalNit) : null;
  if (matchedByNit) {
    const isNameMatch = matchedByNit.nome && requirementService.normalizeName(matchedByNit.nome) === normalizedPortalName;
    
    // Mesmo que o nome não bata 100%, se o CPF mascarado bater, é FULL match
    let isCpfMatch = false;
    if (portalCpf && matchedByNit.cpf) {
      const cleanCpf = matchedByNit.cpf.replaceAll(/\D/g, "");
      const masked = `***.${cleanCpf.substring(3, 6)}.${cleanCpf.substring(6, 9)}-**`;
      isCpfMatch = masked === portalCpf;
    }

    return { 
      member: matchedByNit, 
      matchType: (isNameMatch || isCpfMatch) ? 'FULL' : 'NIT_ONLY' 
    };
  }

  // 2. Tentar Match por Nome + CPF Mascarado (Alta Confiança)
  if (portalCpf) {
    const matchedByMaskedCpf = indexes.maskedCpfMap.get(`${normalizedPortalName}|${portalCpf}`);
    if (matchedByMaskedCpf) {
      return { member: matchedByMaskedCpf, matchType: 'FULL' };
    }
  }

  // 3. Fallback por Nome Normalizado (Média Confiança)
  const matchedByName = indexes.nameMap.get(normalizedPortalName);
  
  if (matchedByName && portalCpf && matchedByName.cpf) {
    const cleanCpf = matchedByName.cpf.replaceAll(/\D/g, "");
    const masked = `***.${cleanCpf.substring(3, 6)}.${cleanCpf.substring(6, 9)}-**`;
    
    // Se o CPF mascarado do portal divergir do CPF mascarado do sócio, não é a mesma pessoa
    if (masked !== portalCpf) {
      return { member: null, matchType: 'NONE' };
    }
  }

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
  // O filtro de UF é obrigatório e deve ser o primeiro a ser aplicado
  const rowUf = getText(row, ["UF"]).toUpperCase().trim();
  
  if (rowUf !== context.entityUf.toUpperCase().trim()) {
    return null;
  }

  const pName = getText(row, ["NOME FAVORECIDO"]);
  const pNit = getText(row, ["NIS FAVORECIDO"]).replaceAll(/\D/g, "");
  const pCpf = getText(row, ["CPF FAVORECIDO"]).trim();

  if (!pName && !pNit && !pCpf) return null;

  const { member, matchType } = findMatchForPortalRow(pName, pNit, pCpf, indexes);

  if (!member) return null;

  const reqThisYear = member.requerimentos?.find((r: any) => r.ano_referencia === anoAtual);
  
  // Se já recebeu, ignoramos no resultado de importação (evita duplicidade visual)
  if (reqThisYear?.beneficio_recebido) return null;

  const cleanMemberCpf = (member.cpf || "").replaceAll(/\D/g, "");

  return {
    portalName: pName,
    portalNit: pNit,
    member: member as ReconciliationResult['member'],
    matchType,
    finance: context.financeMap.get(cleanMemberCpf) ?? undefined,
    hasReqCurrentYear: !!reqThisYear,
    existingReqId: reqThisYear?.id,
    selected: matchType === 'FULL' && !!reqThisYear
  };
}
