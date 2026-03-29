import {
  EscolaridadeValue,
  MemberRegistrationForm,
  SituacaoValue,
  SocioInsert,
  SocioRow,
} from "../types/member.types";
function cleanInvisibleCharacters(value?: string | null): string {
  if (!value || typeof value !== "string") return "";
  return value
    .replaceAll(/[\n\r\t]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
function toUpperOrEmpty(value?: string | null): string | null {
  const cleaned = cleanInvisibleCharacters(value);
  return cleaned ? cleaned.toUpperCase() : null;
}
function toLowerOrEmpty(value?: string | null): string | null {
  const cleaned = cleanInvisibleCharacters(value);
  return cleaned ? cleaned.toLowerCase() : null;
}
function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const cleaned = cleanInvisibleCharacters(cpf);
  const numbers = cleaned.replaceAll(/\D/g, "");
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
  return numbers;
}
function formatPhoneForStorage(phone: string): string | null {
  if (!phone) return null;
  const cleaned = cleanInvisibleCharacters(phone);
  const numbers = cleaned.replaceAll(/\D/g, "");
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)})${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return cleaned || null;
}
function formatCEP(cep: string): string | null {
  if (!cep) return null;
  const cleaned = cleanInvisibleCharacters(cep);
  const numbers = cleaned.replaceAll(/\D/g, "");
  if (numbers.length === 8) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  }
  return cleaned || null;
}
function formatNIT(value?: string | null): string | null {
  if (!value) return null;
  const onlyNumbers = value.replaceAll(/\D/g, "");
  if (onlyNumbers.length !== 11) return cleanInvisibleCharacters(value) || null;
  return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 8)}.${onlyNumbers.slice(8, 10)}-${onlyNumbers.slice(10)}`;
}
function formatCAEPF(value?: string | null): string | null {
  if (!value) return null;
  const onlyNumbers = value.replaceAll(/\D/g, "");
  if (onlyNumbers.length !== 14) return cleanInvisibleCharacters(value) || null;
  return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6, 9)}/${onlyNumbers.slice(9, 12)}-${onlyNumbers.slice(12, 14)}`;
}
function formatCEI(value?: string | null): string | null {
  if (!value) return null;
  const onlyNumbers = value.replaceAll(/\D/g, "");
  if (onlyNumbers.length !== 12) return cleanInvisibleCharacters(value) || null;
  return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5, 10)}/${onlyNumbers.slice(10, 12)}`;
}
export function toMemberInsertPayload(
  input: MemberRegistrationForm,
): SocioInsert {
  return {
    codigo_do_socio: cleanInvisibleCharacters(input.codigoDoSocio) || null,
    codigo_localidade: input.codigoLocalidade
      ? String(input.codigoLocalidade)
      : null,
    nome: toUpperOrEmpty(input.nome),
    apelido: toUpperOrEmpty(input.apelido),
    cpf: formatCPF(input.cpf),
    data_de_nascimento: input.dataDeNascimento || null,
    data_de_admissao: input.dataDeAdmissao || null,
    sexo: input.sexo || null,
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
    estado_civil: cleanInvisibleCharacters(input.estadoCivil) || null,
    alfabetizado: toUpperOrEmpty(input.alfabetizado),
    rg: cleanInvisibleCharacters(input.rg) || null,
    ssp: toUpperOrEmpty(input.ufRg),
    dt_expedicao_rg: input.dataExpedicaoRg || null,
    titulo: cleanInvisibleCharacters(input.tituloEleitor) || null,
    zona: cleanInvisibleCharacters(input.zonaEleitoral) || null,
    secao: cleanInvisibleCharacters(input.secaoEleitoral) || null,
    caepf: formatCAEPF(input.caepf),
    cei: formatCEI(input.cei),
    nit: formatNIT(input.nit),
    emb_rgp: cleanInvisibleCharacters(input.rgp) || null,
    emissao_rgp: input.emissaoRgp || null,
    rgp_uf: toUpperOrEmpty(input.ufRgp),
    situacao: input.situacao || "ATIVO",
    senhagov_inss: input.senhaGovInss || null,
    observacoes: input.observacoes || null,
    escolaridade: toUpperOrEmpty(input.escolaridade),
  } as SocioInsert;
}
export function fromMemberRecord(
  record: SocioRow & {
    fotos?: unknown;
  },
): MemberRegistrationForm {
  const getString = (value: unknown): string =>
    typeof value === "string" ? value : "";
  const parseSituacao = (value: unknown): SituacaoValue => {
    const parsed = getString(value) as SituacaoValue;
    return parsed || "ATIVO";
  };
  const photos = Array.isArray(record.fotos)
    ? record.fotos
        .map((photo) => {
          if (!photo || typeof photo !== "object") return null;
          const typedPhoto = photo as Record<string, unknown>;
          return {
            foto_url: getString(typedPhoto.foto_url) || getString(typedPhoto.url),
          };
        })
        .filter(
          (
            item,
          ): item is {
            foto_url: string;
          } => !!item && !!item.foto_url,
        )
    : null;
  return {
    codigoDoSocio: getString(record.codigo_do_socio),
    codigoLocalidade: record.codigo_localidade
      ? String(record.codigo_localidade)
      : "",
    nome: getString(record.nome),
    apelido: getString(record.apelido),
    cpf: getString(record.cpf),
    dataDeNascimento: getString(record.data_de_nascimento),
    dataDeAdmissao: getString(record.data_de_admissao),
    sexo:
      (getString(record.sexo) as MemberRegistrationForm["sexo"]) || "MASCULINO",
    pai: getString(record.pai),
    mae: getString(record.mae),
    nacionalidade: getString(record.nacionalidade),
    naturalidade: getString(record.naturalidade),
    ufNaturalidade: getString(record.uf_naturalidade),
    endereco: getString(record.endereco),
    numero: getString(record.num),
    bairro: getString(record.bairro),
    cidade: getString(record.cidade),
    uf: getString(record.uf),
    cep: getString(record.cep),
    telefone: getString(record.telefone),
    email: getString(record.email),
    estadoCivil:
      (getString(
        record.estado_civil,
      ) as MemberRegistrationForm["estadoCivil"]) || "Solteiro(a)",
    alfabetizado:
      (getString(
        record.alfabetizado,
      ) as MemberRegistrationForm["alfabetizado"]) || "",
    rg: getString(record.rg),
    ufRg: getString(record.ssp),
    dataExpedicaoRg: getString(record.dt_expedicao_rg),
    tituloEleitor: getString(record.titulo),
    zonaEleitoral: getString(record.zona),
    secaoEleitoral: getString(record.secao),
    caepf: getString(record.caepf),
    cei: getString(record.cei),
    nit: getString(record.nit),
    rgp: getString(record.emb_rgp),
    emissaoRgp: getString(record.emissao_rgp),
    ufRgp: getString(record.rgp_uf),
    situacao: parseSituacao(record.situacao),
    observacoes: getString(record.observacoes),
    senhaGovInss: getString(record.senhagov_inss),
    escolaridade: getString(record.escolaridade) as EscolaridadeValue | "",
    fotos: photos,
    photoDelete: false,
  };
}
