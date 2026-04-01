import { z } from "zod";
const baseStringSchema = z.string().trim();
const optionalStringSchema = z.string().trim().optional().or(z.literal(""));
const numeroRegistroSchema = z
  .string()
  .min(1, "Número de registro é obrigatório")
  .regex(/^\d*$/, "Deve conter apenas números");
const numberStringSchema = z
  .string()
  .regex(/^\d*$/, "Deve conter apenas números")
  .optional()
  .or(z.literal(""));
const numberSpaceStringSchema = z
  .string()
  .regex(/^[\d\s]*$/, "Deve conter apenas números")
  .optional()
  .or(z.literal(""));
const rgSchema = z
  .string()
  .regex(/^[A-Za-z0-9-]*$/, "RG pode conter apenas letras, números e hífen")
  .optional()
  .or(z.literal(""));
const zonaEleitoralSchema = z
  .string()
  .regex(/^\d*$/, "Deve conter apenas números")
  .max(3, "Zona Eleitoral deve ter no máximo 3 dígitos")
  .optional()
  .or(z.literal(""));
const secaoEleitoralSchema = z
  .string()
  .regex(/^\d*$/, "Deve conter apenas números")
  .max(4, "Seção Eleitoral deve ter no máximo 4 dígitos")
  .optional()
  .or(z.literal(""));
const cpfSchema = z
  .string()
  .min(1, "CPF é obrigatório")
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, "CPF deve ter formato válido");
const phoneSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val || val === "") return true;
    const cleaned = val.replaceAll(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 11;
  }, "Telefone deve ter 10 ou 11 dígitos");
const emailSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val || val === "") return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }, "Email deve ter formato válido");
const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, "CEP deve ter formato válido")
  .optional()
  .or(z.literal(""));
const dateSchema = z.string().min(1, "Data é obrigatória");
const optionalDateSchema = z.string().optional().or(z.literal(""));
const nitSchema = z.string().optional().or(z.literal(""));
export const validateCpf = (cpf: unknown): boolean => {
  if (!cpf || typeof cpf !== "string") return false;
  const cleanCpf = cpf.replaceAll(/\D/g, "");
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCpf[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  if (Number.parseInt(cleanCpf[9]) !== digit1) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCpf[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  return Number.parseInt(cleanCpf[10]) === digit2;
};
export const memberRegistrationSchema = z
  .object({
    codigoDoSocio: numeroRegistroSchema,
    dataDeAdmissao: dateSchema,
    codigoLocalidade: numberStringSchema,
    situacao: z
      .enum([
        "ATIVO",
        "APOSENTADO",
        "FALECIDO",
        "TRANSFERIDO",
        "CANCELADO",
        "SUSPENSO",
      ])
      .optional()
      .or(z.literal("")),
    nome: baseStringSchema.min(1, "Nome é obrigatório"),
    apelido: optionalStringSchema,
    cpf: cpfSchema,
    sexo: z
      .enum(["MASCULINO", "FEMININO"])
      .or(z.literal(""))
      .superRefine((val, ctx) => {
        if (val === "") {
          ctx.addIssue({
            code: "custom",
            message: "Sexo é obrigatório",
          });
        }
      }),
    dataDeNascimento: dateSchema,
    estadoCivil: z
      .enum([
        "Solteiro(a)",
        "Casado(a)",
        "Divorciado(a)",
        "Viúvo(a)",
        "União Estável",
      ])
      .or(z.literal(""))
      .superRefine((val, ctx) => {
        if (val === "") {
          ctx.addIssue({
            code: "custom",
            message: "Estado Civil é obrigatório",
          });
        }
      }),
    pai: optionalStringSchema,
    mae: optionalStringSchema,
    nacionalidade: optionalStringSchema,
    naturalidade: optionalStringSchema,
    ufNaturalidade: optionalStringSchema,
    escolaridade: z
      .enum([
        "ANALFABETO(A)",
        "LÊ/ESCREVE",
        "FUNDAMENTAL INCOMPLETO",
        "FUNDAMENTAL COMPLETO",
        "MÉDIO INCOMPLETO",
        "MÉDIO COMPLETO",
        "SUPERIOR INCOMPLETO",
        "SUPERIOR COMPLETO",
        "OUTRO",
      ])
      .optional()
      .or(z.literal("")),
    alfabetizado: z
      .enum(["SIM", "NÃO"])
      .or(z.literal(""))
      .superRefine((val, ctx) => {
        if (val === "") {
          ctx.addIssue({
            code: "custom",
            message: "Alfabetizado é obrigatório",
          });
        }
      }),
    endereco: optionalStringSchema,
    numero: optionalStringSchema,
    bairro: optionalStringSchema,
    cidade: optionalStringSchema,
    uf: optionalStringSchema,
    cep: cepSchema,
    telefone: phoneSchema,
    email: emailSchema,
    rg: rgSchema,
    ufRg: optionalStringSchema,
    dataExpedicaoRg: optionalDateSchema,
    tituloEleitor: numberSpaceStringSchema,
    zonaEleitoral: zonaEleitoralSchema,
    secaoEleitoral: secaoEleitoralSchema,
    zona: optionalStringSchema,
    secao: optionalStringSchema,
    caepf: optionalStringSchema,
    nit: nitSchema,
    cei: optionalStringSchema,
    rgp: optionalStringSchema,
    tipoRgp: z.enum(["INICIAL", "PROTOCOLO", "RECADASTRAMENTO"]).optional().or(z.literal("")),
    emissaoRgp: optionalDateSchema,
    ufRgp: optionalStringSchema,
    senhaGovInss: optionalStringSchema,
    observacoes: optionalStringSchema,
    fotos: z.any().optional().nullable(),
    photoFile: z.any().optional().nullable(),
    photoPreviewUrl: z.string().optional().nullable().or(z.literal("")),
    photoDelete: z.boolean().default(false),
  })
  .refine((data) => validateCpf(data.cpf), {
    message: "CPF inválido",
    path: ["cpf"],
  })
  .refine(
    (data) => {
      if (data.endereco && data.endereco.trim() !== "") {
        return data.codigoLocalidade && data.codigoLocalidade.trim() !== "";
      }
      return true;
    },
    {
      message: "Localidade é obrigatória quando endereço é preenchido",
      path: ["codigoLocalidade"],
    },
  );
export type MemberRegistrationSchemaType = z.infer<
  typeof memberRegistrationSchema
>;
