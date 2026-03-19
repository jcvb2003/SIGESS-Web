import { formatDateForInput } from "@/shared/utils/formatters/dateFormatters";
import type {
  Tables,
  TablesInsert,
} from "@/shared/lib/supabase/database.types";
export type SexoValue = "MASCULINO" | "FEMININO";
export type EstadoCivilValue =
  | "Solteiro(a)"
  | "Casado(a)"
  | "Divorciado(a)"
  | "Viúvo(a)"
  | "União Estável"
  | "";
export type AlfabetizadoValue = "SIM" | "NÃO";
export type SituacaoValue =
  | "ATIVO"
  | "APOSENTADO"
  | "FALECIDO"
  | "TRANSFERIDO"
  | "CANCELADO"
  | "SUSPENSO";
export type EscolaridadeValue =
  | "ANALFABETO(A)"
  | "LÊ/ESCREVE"
  | "FUNDAMENTAL INCOMPLETO"
  | "FUNDAMENTAL COMPLETO"
  | "MÉDIO INCOMPLETO"
  | "MÉDIO COMPLETO"
  | "SUPERIOR INCOMPLETO"
  | "SUPERIOR COMPLETO"
  | "OUTRO";
export type SocioRow = Tables<"socios">;
export type SocioInsert = TablesInsert<"socios">;
export interface MemberRegistrationForm {
  codigoDoSocio: string;
  codigoLocalidade: string;
  nome: string;
  apelido: string;
  cpf: string;
  dataDeNascimento: string;
  dataDeAdmissao: string;
  sexo: SexoValue | "";
  pai: string;
  mae: string;
  nacionalidade: string;
  naturalidade: string;
  ufNaturalidade: string;
  escolaridade: EscolaridadeValue | "";
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  estadoCivil: EstadoCivilValue;
  alfabetizado: AlfabetizadoValue | "";
  rg: string;
  ufRg: string;
  dataExpedicaoRg: string;
  tituloEleitor: string;
  zonaEleitoral: string;
  secaoEleitoral: string;
  caepf: string;
  cei: string;
  nit: string;
  rgp: string;
  emissaoRgp: string;
  ufRgp: string;
  situacao: SituacaoValue;
  observacoes: string;
  senhaGovInss: string;
  fotos?:
    | {
        foto_url: string;
      }[]
    | null;
  photoFile?: File | null;
  photoPreviewUrl?: string | null;
  photoDelete: boolean;
}
export type StatusFilter = "all" | SituacaoValue;
export type RgpStatusFilter = "all" | "with_rgp" | "without_rgp";
export interface MemberListItem {
  id: string;
  codigo_do_socio: string | null;
  nome: string | null;
  cpf: string | null;
  data_de_admissao: string | null;
  situacao: string | null;
  codigo_localidade?: string | null;
}
export interface MembersResult {
  items: MemberListItem[];
  total: number;
}
export interface MemberSearchParams {
  page: number;
  pageSize: number;
  searchTerm: string;
  statusFilter: StatusFilter;
  localityCode: string;
  birthMonth?: string;
  gender: string;
  rgpStatus: RgpStatusFilter;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}
export interface LocalityOption {
  code: string;
  name: string;
}
export const initialMemberRegistrationForm: MemberRegistrationForm = {
  codigoDoSocio: "",
  codigoLocalidade: "",
  nome: "",
  apelido: "",
  cpf: "",
  dataDeNascimento: "",
  dataDeAdmissao: formatDateForInput(new Date()),
  sexo: "",
  pai: "",
  mae: "",
  nacionalidade: "BRASILEIRA",
  naturalidade: "",
  ufNaturalidade: "PA",
  escolaridade: "",
  endereco: "",
  numero: "",
  bairro: "",
  cidade: "OEIRAS DO PARÁ",
  uf: "PA",
  cep: "68470-000",
  telefone: "",
  email: "",
  estadoCivil: "",
  alfabetizado: "",
  rg: "",
  ufRg: "PA",
  dataExpedicaoRg: "",
  tituloEleitor: "",
  zonaEleitoral: "",
  secaoEleitoral: "",
  caepf: "",
  cei: "",
  nit: "",
  rgp: "",
  emissaoRgp: "",
  ufRgp: "PA",
  situacao: "ATIVO",
  observacoes: "",
  senhaGovInss: "",
  fotos: null,
  photoFile: null,
  photoPreviewUrl: null,
  photoDelete: false,
};
