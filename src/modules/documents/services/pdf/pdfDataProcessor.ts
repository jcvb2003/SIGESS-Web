import { MemberDatabase } from "../../types/document.types";
import { EntitySettings } from "@/shared/types/entity.types";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
export function processDocumentData(
  member: MemberDatabase,
  entity: EntitySettings | null,
  additionalData: Record<string, string> = {},
  customDate?: string,
): Record<string, string> {
  const dataNascimento = formatDate(member.data_de_nascimento);
  const dataRgp = formatDate(member.emissao_rgp);
  let today = new Date();
  let dataAtual = formatDate(today);
  if (customDate) {
    const datePart = customDate.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) {
      today = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      dataAtual = formatDate(datePart);
    }
  }
  const dia = String(today.getDate()).padStart(2, "0");
  const mes = String(today.getMonth() + 1).padStart(2, "0");
  const ano = String(today.getFullYear());
  const map: Record<string, string> = {
    nome: member.nome || "",
    nome_completo: member.nome || "",
    cpf: member.cpf || "",
    rg: member.rg || "",
    data_nascimento: dataNascimento,
    dtnascimento: dataNascimento,
    dtnasc: dataNascimento,
    rgp: member.rgp || "",
    nit: member.nit || "",
    cei: member.cei || "",
    endereco: member.endereco || "",
    logradouro: member.endereco || "",
    num: member.num || member.numero || "",
    numero: member.num || member.numero || "",
    complemento: "",
    bairro: member.bairro || "",
    cidade: member.cidade || "",
    municipio: member.cidade || "",
    uf: member.uf || "",
    "UF de residência": member.uf || "",
    cep: member.cep || "",
    CEP: member.cep || "",
    telefone: member.telefone || "",
    celular: member.telefone || "",
    matricula: member.codigo_do_socio || "",
    Matrícula: member.codigo_do_socio || "",
    endereco_completo: `${member.endereco || ""}, ${member.num || member.numero || ""} - ${member.bairro || ""}, ${member.cidade || ""}/${member.uf || ""}`,
    data_atual: dataAtual,
    data: dataAtual,
    local: member.cidade || "",
    local_assinatura: `${member.cidade || ""} - ${member.uf || ""}`,
    Email: member.email || "",
    dia: dia,
    mes: mes,
    ano: ano,
    estado_civil: member.estado_civil || "",
    mae: member.mae || "",
    nome_mae: member.mae || "",
    pai: member.pai || "",
    nome_pai: member.pai || "",
    nacionalidade: member.nacionalidade || "",
    naturalidade: member.naturalidade || "",
    escolaridade: member.escolaridade || "",
    observacoes: member.observacoes || "",
    nome_abreviado: entity?.shortName || entity?.name || "",
    cnpj: entity?.cnpj || "",
    nome_entidade: entity?.name || "",
    Nome: member.nome || "",
    NomeCompleto: member.nome || "",
    RGP: member.rgp || "",
    NIT: member.nit || "",
    Endereco: member.endereco || "",
    Logradouro: member.endereco || "",
    Numero: member.num || member.numero || "",
    Bairro: member.bairro || "",
    Cidade: member.cidade || "",
    Municipio: member.cidade || "",
    Telefone: member.telefone || "",
    Celular: member.telefone || "",
    Matricula: member.codigo_do_socio || "",
    outorgante: member.nome || "",
    outorgante_cpf: member.cpf || "",
    outorgante_rg: member.rg || "",
    outorgante_endereco: `${member.endereco || ""}, ${member.num || member.numero || ""} - ${member.bairro || ""}, ${member.cidade || ""}/${member.uf || ""}`,
    declarada: member.nome || "",
    declarada_cpf: member.cpf || "",
    declarada_rg: member.rg || "",
    residente: member.nome || "",
    emb_rgp: member.emb_rgp || member.rgp || "",
    "Número do RGP": member.emb_rgp || member.rgp || "",
    rgp_uf: member.rgp_uf || member.uf_rgp || member.uf || "",
    rgp_data: dataRgp,
    data_rgp: dataRgp,
    nrpub: additionalData["publicationNumber"] || "",
    dtpub: additionalData["publicationDate"]
      ? formatDate(additionalData["publicationDate"])
      : "",
    area: additionalData["fishingArea"] || "",
    inicio1: additionalData["defeso1Start"]
      ? formatDate(additionalData["defeso1Start"])
      : "",
    fim1: additionalData["defeso1End"]
      ? formatDate(additionalData["defeso1End"])
      : "",
    inicio2: additionalData["defeso2Start"]
      ? formatDate(additionalData["defeso2Start"])
      : "",
    fim2: additionalData["defeso2End"]
      ? formatDate(additionalData["defeso2End"])
      : "",
    especie_proibidas: additionalData["defesoSpecies"] || "",
    "Número da Portaria": additionalData["publicationNumber"] || "",
    "Data da publicação da portaria": additionalData["publicationDate"]
      ? formatDate(additionalData["publicationDate"])
      : "",
    "Início do Primeiro Período": additionalData["defeso1Start"]
      ? formatDate(additionalData["defeso1Start"])
      : "",
    "Fim do Primeiro Período": additionalData["defeso1End"]
      ? formatDate(additionalData["defeso1End"])
      : "",
    "Início do segundo período": additionalData["defeso2Start"]
      ? formatDate(additionalData["defeso2Start"])
      : "",
    "Fim do segundo período": additionalData["defeso2End"]
      ? formatDate(additionalData["defeso2End"])
      : "",
    "Espécies proibidas": additionalData["defesoSpecies"] || "",
    Área: additionalData["fishingArea"] || "",
  };
  return { ...map, ...additionalData };
}
export function processSimpleStatementData(
  member: MemberDatabase,
  entity: EntitySettings | null,
  additionalData: Record<string, string> = {},
  customDate?: string,
): Record<string, string> {
  const processedData = processDocumentData(
    member,
    entity,
    additionalData,
    customDate,
  );
  return {
    ...processedData,
    ...additionalData,
  };
}
