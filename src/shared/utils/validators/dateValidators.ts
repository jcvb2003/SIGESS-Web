import { z } from "zod";

/**
 * SIGESS Shared Utilities: Date Validators
 * 
 * Centraliza a lógica de validação de datas para garantir que:
 * 1. O formato seja válido (YYYY-MM-DD do HTML5).
 * 2. Datas impossíveis (ex: 31/02) sejam rejeitadas.
 * 3. Restrições temporais (passado/futuro/idade) sejam aplicadas.
 */

/**
 * Verifica se uma string de data é válida e existente no calendário.
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString || dateString.trim() === "") return false;
  const d = new Date(dateString);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(dateString.substring(0, 10));
};

/**
 * Verifica se a data não é futura (permite o dia atual até o último milissegundo).
 */
export const isNotFutureDate = (dateString: string): boolean => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date.getTime() <= today.getTime();
};

/**
 * Verifica se a data é estritamente no passado (anterior a hoje).
 */
export const isPastDate = (dateString: string): boolean => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

/**
 * Schema Zod Base para Datas Obrigatórias.
 */
export const requiredDateSchema = (message = "Data inválida") =>
  z.string()
    .min(1, "Data é obrigatória")
    .refine(isValidDate, { message })
    .refine(isNotFutureDate, { message: "A data não pode ser futura" });

/**
 * Schema Zod para Datas de Nascimento (estritamente passado + sanidade de idade).
 */
export const birthDateSchema = z.string()
  .min(1, "Data de nascimento é obrigatória")
  .refine(isValidDate, { message: "Data de nascimento inválida" })
  .refine(isPastDate, { message: "A data de nascimento deve ser no passado" })
  .refine((val) => {
    const year = new Date(val).getFullYear();
    const currentYear = new Date().getFullYear();
    return year > currentYear - 120; // Ninguém vive mais de 120 anos (via de regra no SIGESS)
  }, { message: "Data de nascimento irreal (máximo 120 anos)" });

/**
 * Schema Zod para Datas Opcionais (Permite Futuro).
 * Útil para configurações como períodos de defeso.
 */
export const flexibleDateSchema = z.string()
  .nullable()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || isValidDate(val), { message: "Data inválida" });

/**
 * Schema Zod para Datas Opcionais (NÃO Permite Futuro).
 * Padrão para a maioria dos campos do sistema (Nascimento, Documentos, etc).
 */
export const optionalDateSchema = flexibleDateSchema
  .refine((val) => !val || isNotFutureDate(val), { message: "A data não pode ser futura" });

/**
 * Schema Zod para Emissão de Documentos (RG, RGP).
 */
export const documentIssueDateSchema = optionalDateSchema.refine(
  (val) => !val || isPastDate(val),
  { message: "A data de emissão deve ser no passado" }
);
