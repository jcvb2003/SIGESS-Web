
import { MemberRegistrationForm } from '../types/member.types'

/**
 * Remove caracteres invisíveis como quebras de linha, tabulações e espaços extras
 */
function cleanInvisibleCharacters(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  
  return value
    .replace(/[\n\r\t]+/g, ' ')     // Substitui quebras de linha, retorno de carro e tabulações por espaço simples
    .replace(/\s+/g, ' ')           // Remove múltiplos espaços consecutivos
    .trim();                        // Remove espaços no início e fim
}

/**
 * Converte para maiúsculo ou string vazia, removendo caracteres invisíveis
 */
function toUpperOrEmpty(value?: string | null): string | null {
  const cleaned = cleanInvisibleCharacters(value);
  return cleaned ? cleaned.toUpperCase() : null;
}

/**
 * Converte para minúsculo ou string vazia, removendo caracteres invisíveis
 */
function toLowerOrEmpty(value?: string | null): string | null {
  const cleaned = cleanInvisibleCharacters(value);
  return cleaned ? cleaned.toLowerCase() : null;
}

/**
 * Formata CPF para o formato 000.000.000-00
 */
function formatCPF(cpf: string): string {
  if (!cpf) return '';
  
  const cleaned = cleanInvisibleCharacters(cpf);
  const numbers = cleaned.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
  
  return numbers;
}

/**
 * Formata telefone para o padrão legado (XX)XXXXX-XXXX ou (XX)XXXX-XXXX
 */
function formatPhoneForStorage(phone: string): string | null {
  if (!phone) return null;
  
  const cleaned = cleanInvisibleCharacters(phone);
  const numbers = cleaned.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)})${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return cleaned || null;
}

/**
 * Formata CEP para o padrão 00000-000
 */
function formatCEP(cep: string): string | null {
  if (!cep) return null;
  
  const cleaned = cleanInvisibleCharacters(cep);
  const numbers = cleaned.replace(/\D/g, '');
  
  if (numbers.length === 8) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  
  return cleaned || null;
}

export function toMemberInsertPayload(input: MemberRegistrationForm) {
  return {
    codigo_do_socio: cleanInvisibleCharacters(input.codigoDoSocio) || null,
    codigo_localidade: input.codigoLocalidade ? Number(input.codigoLocalidade) : null,
    nome: toUpperOrEmpty(input.nome),
    apelido: toUpperOrEmpty(input.apelido),
    cpf: formatCPF(input.cpf),
    data_de_nascimento: input.dataDeNascimento || null,
    data_de_admissao: input.dataDeAdmissao || null,
    sexo: input.sexo,
    pai: toUpperOrEmpty(input.pai),
    mae: toUpperOrEmpty(input.mae),
    nacionalidade: toUpperOrEmpty(input.nacionalidade),
    naturalidade: toUpperOrEmpty(input.naturalidade),
    uf_naturalidade: toUpperOrEmpty(input.ufNaturalidade),
    endereco: toUpperOrEmpty(input.endereco),
    num: toUpperOrEmpty(input.numero),
    bairro: toUpperOrEmpty(input.bairro),
    cidade: toUpperOrEmpty(input.cidade),
    uf: toUpperOrEmpty(input.uf),
    cep: formatCEP(input.cep),
    telefone: formatPhoneForStorage(input.telefone),
    email: toLowerOrEmpty(input.email),
    estado_civil: toUpperOrEmpty(input.estadoCivil),
    alfabetizado: toUpperOrEmpty(input.alfabetizado),
    rg: cleanInvisibleCharacters(input.rg) || null,
    ssp: toUpperOrEmpty(input.ufRg),
    dt_expedicao_rg: input.dataExpedicaoRg || null,
    titulo: cleanInvisibleCharacters(input.tituloEleitor) || null,
    zona: cleanInvisibleCharacters(input.zonaEleitoral) || null,
    secao: cleanInvisibleCharacters(input.secaoEleitoral) || null,
    caepf: cleanInvisibleCharacters(input.caepf) || null,
    pis: cleanInvisibleCharacters(input.pis) || null,
    cei: cleanInvisibleCharacters(input.cei) || null,
    nit: cleanInvisibleCharacters(input.nit) || null,
    emb_rgp: cleanInvisibleCharacters(input.rgp) || null,
    emissao_rgp: input.emissaoRgp || null,
    rgp_uf: toUpperOrEmpty(input.ufRgp),
    situacao: input.situacao || '1 - ATIVO',
    situacao_mpa: input.situacaoMpa || null,
    senhagov_inss: input.senhaGovInss || null,
    observacoes: input.observacoes || null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromMemberRecord(record: any): MemberRegistrationForm {
  return {
    codigoDoSocio: record.codigo_do_socio || '',
    codigoLocalidade: record.codigo_localidade ? String(record.codigo_localidade) : '',
    nome: record.nome || '',
    apelido: record.apelido || '',
    cpf: record.cpf || '',
    dataDeNascimento: record.data_de_nascimento || '',
    dataDeAdmissao: record.data_de_admissao || '',
    sexo: record.sexo || 'MASCULINO',
    pai: record.pai || '',
    mae: record.mae || '',
    nacionalidade: record.nacionalidade || '',
    naturalidade: record.naturalidade || '',
    ufNaturalidade: record.uf_naturalidade || '',
    endereco: record.endereco || '',
    numero: record.num || '',
    bairro: record.bairro || '',
    cidade: record.cidade || '',
    uf: record.uf || '',
    cep: record.cep || '',
    telefone: record.telefone || '',
    email: record.email || '',
    estadoCivil: record.estado_civil || '',
    alfabetizado: record.alfabetizado || '',
    rg: record.rg || '',
    ufRg: record.ssp || '', // Mapeando ssp de volta para ufRg
    dataExpedicaoRg: record.dt_expedicao_rg || '',
    tituloEleitor: record.titulo || '',
    zonaEleitoral: record.zona || '',
    secaoEleitoral: record.secao || '',
    caepf: record.caepf || '',
    pis: record.pis || '',
    cei: record.cei || '',
    nit: record.nit || '',
    rgp: record.emb_rgp || '',
    emissaoRgp: record.emissao_rgp || '',
    ufRgp: record.rgp_uf || '',
    situacao: record.situacao || '',
    situacaoMpa: record.situacao_mpa || '',
    observacoes: record.observacoes || '',
    senhaGovInss: record.senhagov_inss || '',
    fotos: record.fotos || null,
  }
}
