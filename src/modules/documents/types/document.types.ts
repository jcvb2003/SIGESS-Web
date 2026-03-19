export interface DocumentListItem {
  id: string;
  cod_req_inss: string | null;
  data: string | null;
  codigo_do_socio: string | null;
  nome: string | null;
  cpf: string | null;
}
export interface DocumentsResult {
  items: DocumentListItem[];
  total: number;
}
export interface DocumentSearchParams {
  page: number;
  pageSize: number;
  searchTerm: string;
}
export interface MemberDatabase {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_expedicao_rg?: string;
  uf_rg?: string;
  emissao_rgp?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  estado_civil?: string;
  email?: string;
  pai?: string;
  mae?: string;
  nacionalidade?: string;
  naturalidade?: string;
  uf_naturalidade?: string;
  data_de_nascimento?: string;
  titulo_eleitor?: string;
  zona_eleitoral?: string;
  secao_eleitoral?: string;
  nit?: string;
  cei?: string;
  caepf?: string;
  rgp?: string;
  emb_rgp?: string;
  uf_rgp?: string;
  situacao?: string;
  codigo_do_socio?: string;
  data_de_admissao?: string;
  codigo_localidade?: string;
  foto_url?: string | null;
  num?: string;
  rgp_uf?: string;
  escolaridade?: string;
  senhagov_inss?: string;
  observacoes?: string;
}
export interface MemberSelectOption {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  foto_url?: string | null;
}
