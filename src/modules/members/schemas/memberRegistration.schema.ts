
import { z } from 'zod'

// Schema base para campos comuns
const baseStringSchema = z.string().trim()
const optionalStringSchema = z.string().trim().optional().or(z.literal(''))

// Schema para número de registro - AGORA OBRIGATÓRIO
const numeroRegistroSchema = z.string()
  .min(1, 'Número de registro é obrigatório')
  .regex(/^\d*$/, 'Deve conter apenas números')

// Schema para campos numéricos opcionais
const numberStringSchema = z.string().regex(/^\d*$/, 'Deve conter apenas números').optional().or(z.literal(''))

// Schema para RG - aceita letras, números e hífen
const rgSchema = z.string()
  .regex(/^[A-Za-z0-9-]*$/, 'RG pode conter apenas letras, números e hífen')
  .optional()
  .or(z.literal(''))

// Schema para campos numéricos com comprimento específico
const zonaEleitoralSchema = z.string()
  .regex(/^\d*$/, 'Deve conter apenas números')
  .max(3, 'Zona Eleitoral deve ter no máximo 3 dígitos')
  .optional()
  .or(z.literal(''))

const secaoEleitoralSchema = z.string()
  .regex(/^\d*$/, 'Deve conter apenas números')
  .max(4, 'Seção Eleitoral deve ter no máximo 4 dígitos')
  .optional()
  .or(z.literal(''))

// Schema para CPF - AGORA OBRIGATÓRIO
const cpfSchema = z.string()
  .min(1, 'CPF é obrigatório')
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF deve ter formato válido')

// Schema para telefone - mais flexível
const phoneSchema = z.string()
  .optional()
  .or(z.literal(''))
  .refine((val) => {
    if (!val || val === '') return true // Permite vazio
    const cleaned = val.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 11
  }, 'Telefone deve ter 10 ou 11 dígitos')

// Schema para email - mais flexível
const emailSchema = z.string()
  .optional()
  .or(z.literal(''))
  .refine((val) => {
    if (!val || val === '') return true // Permite vazio
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
  }, 'Email deve ter formato válido')

// Schema para CEP
const cepSchema = z.string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato válido')
  .optional()
  .or(z.literal(''))

// Schema para data no formato AAAA-MM-DD (Input date HTML5) ou DDMMAAAA
// O input type="date" retorna AAAA-MM-DD
const dateSchema = z.string()
  .min(1, 'Data é obrigatória')

// Schema para data opcional
const optionalDateSchema = z.string()
  .optional()
  .or(z.literal(''))

// Schema para CAEPF - sem validação de formato
const caepfSchema = z.string().optional().or(z.literal(''))

// Schema para NIT - sem validação de formato
const nitSchema = z.string().optional().or(z.literal(''))

// Validações customizadas de CPF
export const validateCpf = (cpf: string | unknown): boolean => {
  if (!cpf || typeof cpf !== 'string') return false // CPF é obrigatório
  
  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false
  
  // Validação do algoritmo do CPF
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i)
  }
  let digit1 = 11 - (sum % 11)
  if (digit1 > 9) digit1 = 0
  
  if (parseInt(cleanCpf[9]) !== digit1) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i)
  }
  let digit2 = 11 - (sum % 11)
  if (digit2 > 9) digit2 = 0
  
  return parseInt(cleanCpf[10]) === digit2
}

export const memberRegistrationSchema = z.object({
  // Informações de registro
  codigoDoSocio: numeroRegistroSchema,
  dataDeAdmissao: dateSchema,
  codigoLocalidade: numberStringSchema,
  situacao: z.enum([
    '1 - ATIVO',
    '2 - APOSENTADO',
    '3 - FALECIDO',
    '4 - TRANSFERIDO',
    '5 - CANCELADO',
    '6 - SUSPENSO'
  ]).optional().or(z.literal('')),
  situacaoMpa: z.enum(['ATIVO', 'SUSPENSO']).optional().or(z.literal('')),

  // Dados pessoais
  nome: baseStringSchema.min(1, 'Nome é obrigatório'),
  apelido: optionalStringSchema,
  cpf: cpfSchema,
  sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  dataDeNascimento: dateSchema,
  estadoCivil: z.enum([
    'SOLTEIRO(A)',
    'CASADO(A)',
    'DIVORCIADO(A)',
    'VIÚVO(A)',
    'UNIÃO ESTÁVEL'
  ]).optional().or(z.literal('')),
  pai: optionalStringSchema,
  mae: optionalStringSchema,
  nacionalidade: optionalStringSchema,
  naturalidade: optionalStringSchema,
  ufNaturalidade: optionalStringSchema,
  alfabetizado: z.enum(['SIM', 'NÃO']).optional().or(z.literal('')),

  // Endereço e contato
  endereco: optionalStringSchema,
  numero: optionalStringSchema,
  bairro: optionalStringSchema,
  cidade: optionalStringSchema,
  uf: optionalStringSchema,
  cep: cepSchema,
  telefone: phoneSchema,
  email: emailSchema,

  // Documentos
  rg: rgSchema,
  ufRg: optionalStringSchema,
  dataExpedicaoRg: optionalDateSchema,
  tituloEleitor: numberStringSchema,
  zonaEleitoral: zonaEleitoralSchema,
  secaoEleitoral: secaoEleitoralSchema,
  caepf: caepfSchema,
  pis: numberStringSchema,
  cei: numberStringSchema,
  nit: nitSchema,
  rgp: optionalStringSchema,
  emissaoRgp: optionalDateSchema,
  ufRgp: optionalStringSchema,
  senhaGovInss: optionalStringSchema,

  // Observações
  observacoes: optionalStringSchema
}).refine(
  (data) => validateCpf(data.cpf),
  {
    message: 'CPF inválido',
    path: ['cpf']
  }
).refine(
  (data) => {
    // Se endereço estiver preenchido, localidade é obrigatória
    if (data.endereco && data.endereco.trim() !== '') {
      return data.codigoLocalidade && data.codigoLocalidade.trim() !== ''
    }
    return true
  },
  {
    message: 'Localidade é obrigatória quando endereço é preenchido',
    path: ['codigoLocalidade']
  }
)

export type MemberRegistrationSchemaType = z.infer<typeof memberRegistrationSchema>
