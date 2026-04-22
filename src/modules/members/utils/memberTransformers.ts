import type { MemberListItem, MemberRegistrationForm } from "../types/member.types";

/**
 * Converte o formato do formulário de registro para o formato simplificado da listagem
 */
export const toMemberListItem = (
  id: string,
  member: Partial<MemberRegistrationForm> & {
    nome?: string;
    cpf?: string;
    situacao?: string;
  },
): MemberListItem => ({
  id,
  codigo_do_socio: member.codigoDoSocio ?? null,
  nome: member.nome ?? null,
  cpf: member.cpf ?? null,
  data_de_admissao: member.dataDeAdmissao ?? null,
  situacao: member.situacao ?? null,
  codigo_localidade: member.codigoLocalidade ?? null,
});

/**
 * Mapeia um registro bruto do banco de dados (da tabela socios) para MemberListItem
 */
export const mapRowToListItem = (
  row: Record<string, unknown>,
  photoUrlBuilder?: (cpf: string, cacheVersion?: string | boolean) => string | null
): MemberListItem => {
  const cpf = typeof row.cpf === 'string' ? row.cpf : null;
  const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : undefined;
  
  return {
    id: String(row.id),
    codigo_do_socio: typeof row.codigo_do_socio === 'string' ? row.codigo_do_socio : null,
    nome: typeof row.nome === 'string' ? row.nome : null,
    cpf,
    data_de_admissao: typeof row.data_de_admissao === 'string' ? row.data_de_admissao : null,
    situacao: typeof row.situacao === 'string' ? row.situacao : null,
    codigo_localidade: typeof row.codigo_localidade === 'string' ? row.codigo_localidade : null,
    foto_url: cpf && photoUrlBuilder ? (photoUrlBuilder(cpf, updatedAt) ?? null) : null,
  };
};
