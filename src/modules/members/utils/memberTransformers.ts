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
