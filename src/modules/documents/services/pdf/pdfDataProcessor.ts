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
  const entityStreet = entity?.street || "";
  const entityNumber = entity?.number ? `, ${entity.number}` : "";

  let enderecoCompleto = member.endereco || "";
  if (member.num || member.numero) {
    enderecoCompleto += `, ${member.num || member.numero}`;
  }
  if (member.bairro) {
    enderecoCompleto += ` - ${member.bairro}`;
  }

  const map: Record<string, string> = {
    // Membro / Requerente
    nome: member.nome || "",
    cpf: member.cpf || "",
    rg: member.rg || "",
    dtnasc: dataNascimento,
    data_filiacao: member.data_de_admissao ? formatDate(member.data_de_admissao) : "",
    mae: member.mae || "",
    nit: member.nit || "",
    cei: member.cei || "",
    endereco: member.endereco || "",
    endereco_completo: enderecoCompleto,
    num: member.num || member.numero || "",
    complemento: "",
    bairro: member.bairro || "",
    cidade: member.cidade || "",
    uf: member.uf || "",
    cep: member.cep || "",
    telefone: member.telefone || "",
    email: member.email || "",
    estado_civil: member.estado_civil || "",

    // Dados auxiliares (não mapeados diretamente a campos de PDF)
    dia: dia,
    mes: mes,
    ano: ano,
    nacionalidade: member.nacionalidade || "",
    naturalidade: member.naturalidade || "",
    escolaridade: member.escolaridade || "",

    // Entidade Administrativa
    entidade_nome: entity?.name || "",
    entidade_cnpj: entity?.cnpj || "",
    entidade_endereco: `${entityStreet}${entityNumber}`,
    entidade_cidade: entity?.city || "",
    nome_presidente: entity?.presidentName || "",
    cpf_presidente: entity?.presidentCpf || "",

    // Embarcação / RGP
    num_rgp: member.num_rgp || member.rgp || "",
    rgp_uf: member.rgp_uf || member.uf_rgp || "",
    data_rgp: dataRgp,

    // Defeso / Portarias
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

    // Assinatura e Local
    local_assinatura: `${member.cidade || ""} - ${member.uf || ""}`,
    data_atual: dataAtual,
    data: dataAtual,
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
