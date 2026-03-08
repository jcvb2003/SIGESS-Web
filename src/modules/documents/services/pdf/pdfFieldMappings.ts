/**
 * REGRA DE PADRONIZAÇÃO (PROIBIDO VARIAÇÕES):
 *
 * Cada chave interna mapeia para EXATAMENTE UM nome de campo no PDF.
 * Variações, fallbacks ou nomes alternativos são ESTRITAMENTE PROIBIDOS.
 *
 * Todos os PDFs enviados ao sistema DEVEM seguir o padrão do PDF de Requerimento.
 * Se um PDF possuir campo com nome diferente do padrão, o PDF deve ser corrigido
 * manualmente antes de ser usado pelo sistema.
 *
 * Caso um novo campo seja necessário, ele deve ser adicionado aqui com UM ÚNICO
 * nome padronizado, e o PDF correspondente deve usar esse mesmo nome.
 */
export function getPdfFieldMappings(): Record<string, string[]> {
  return {
    // Membro / Requerente
    nome: ["Nome do requerente"],
    dtnasc: ["Data de nascimento"],
    data_filiacao: ["Data de filiação"],
    mae: ["Nome da mãe"],
    cpf: ["CPF do requerente"],
    rg: ["RG"],
    nit: ["PIS"],
    cei: ["CEI"],
    endereco: ["Endereço do requerente"],
    endereco_completo: ["Endereço do requerente completo"],
    num: ["Número"],
    complemento: ["Complemento"],
    bairro: ["Bairro"],
    cidade: ["Município"],
    uf: ["UF de residência"],
    cep: ["CEP"],
    telefone: ["Telefone do requerente"],
    email: ["Email do requerente"],
    estado_civil: ["Estado civil"],

    // Dados de Defeso / Portarias
    nrpub: ["Número da portaria"],
    dtpub: ["Data da publicação da portaria"],
    area: ["Área"],
    inicio1: ["Início do primeiro período"],
    fim1: ["Fim do primeiro período"],
    inicio2: ["Início do segundo período"],
    fim2: ["Fim do segundo período"],
    especie_proibidas: ["Espécies proibidas"],

    // Dados de Embarcação / RGP
    num_rgp: ["Número do RGP"],
    rgp_uf: ["UF do RGP"],
    data_rgp: ["Data do RGP"],
    arqueacao_bruta: ["Arqueação bruta"],
    total_tripulantes: ["Total de tripulantes"],
    cpf_proprietario_embarcacao: ["CPF do proprietário da embarcação"],

    // Entidade Administrativa
    entidade_nome: ["Nome da entidade administrativa"],
    entidade_cnpj: ["CNPJ da entidade administrativa"],
    entidade_endereco: ["Endereço da entidade administrativa"],
    entidade_cidade: ["Municipio da entidade administrativa"],
    nome_presidente: ["Nome do presidente"],
    cpf_presidente: ["CPF do presidente"],

    // Testemunhas
    nome_testemunha1: ["Nome da testemunha 1"],
    cpf_testemunha1: ["CPF da testemunha 1"],
    rg_testemunha1: ["RG da testemunha 1"],
    nome_testemunha2: ["Nome da testemunha 2"],
    cpf_testemunha2: ["CPF da testemunha 2"],
    rg_testemunha2: ["RG da testemunha 2"],

    // Assinatura e Local
    local_assinatura: ["Município e estado"],
    data_atual: ["Data"],
    data: ["Data da assinatura"],
  };
}

