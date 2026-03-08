
export type SexoValue = 'MASCULINO' | 'FEMININO' | 'OUTRO'
export type EstadoCivilValue = 'SOLTEIRO(A)' | 'CASADO(A)' | 'DIVORCIADO(A)' | 'VIÚVO(A)' | 'UNIÃO ESTÁVEL'
export type AlfabetizadoValue = 'SIM' | 'NÃO'
export type SituacaoValue = '1 - ATIVO' | '2 - APOSENTADO' | '3 - FALECIDO' | '4 - TRANSFERIDO' | '5 - CANCELADO' | '6 - SUSPENSO'
export type SituacaoMpaValue = 'ATIVO' | 'SUSPENSO'

export interface MemberRegistrationForm {
  codigoDoSocio: string
  codigoLocalidade: string
  nome: string
  apelido: string
  cpf: string
  dataDeNascimento: string
  dataDeAdmissao: string
  sexo: SexoValue
  pai: string
  mae: string
  nacionalidade: string
  naturalidade: string
  ufNaturalidade: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  telefone: string
  email: string
  estadoCivil: EstadoCivilValue
  alfabetizado: AlfabetizadoValue
  rg: string
  ufRg: string
  dataExpedicaoRg: string
  tituloEleitor: string
  zonaEleitoral: string
  secaoEleitoral: string
  caepf: string
  pis: string
  cei: string
  nit: string
  rgp: string
  emissaoRgp: string
  ufRgp: string
  situacao: SituacaoValue
  situacaoMpa: SituacaoMpaValue
  observacoes: string
  senhaGovInss: string
  fotos?: { url: string }[] | null
}

export type StatusFilter = 'all' | SituacaoValue
export type RgpStatusFilter = 'all' | 'with_rgp' | 'without_rgp'

export interface MemberListItem {
  id: string
  codigo_do_socio: string | null
  nome: string | null
  cpf: string | null
  data_de_admissao: string | null
  situacao: string | null
  codigo_localidade?: string | null
}

export interface MembersResult {
  items: MemberListItem[]
  total: number
}

export interface MemberSearchParams {
  page: number
  pageSize: number
  searchTerm: string
  statusFilter: StatusFilter
  localityCode: string
  birthMonth: string
  gender: string
  rgpStatus: RgpStatusFilter
}

export interface LocalityOption {
  code: string
  name: string
}

export const initialMemberRegistrationForm: MemberRegistrationForm = {
  codigoDoSocio: '',
  codigoLocalidade: '',
  nome: '',
  apelido: '',
  cpf: '',
  dataDeNascimento: '',
  dataDeAdmissao: '',
  sexo: 'MASCULINO',
  pai: '',
  mae: '',
  nacionalidade: '',
  naturalidade: '',
  ufNaturalidade: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  telefone: '',
  email: '',
  estadoCivil: 'SOLTEIRO(A)',
  alfabetizado: 'SIM',
  rg: '',
  ufRg: '',
  dataExpedicaoRg: '',
  tituloEleitor: '',
  zonaEleitoral: '',
  secaoEleitoral: '',
  caepf: '',
  pis: '',
  cei: '',
  nit: '',
  rgp: '',
  emissaoRgp: '',
  ufRgp: '',
  situacao: '1 - ATIVO',
  situacaoMpa: 'ATIVO',
  observacoes: '',
  senhaGovInss: '',
  fotos: null,
}
