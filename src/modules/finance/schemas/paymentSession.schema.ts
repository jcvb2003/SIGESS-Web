import { z } from "zod";

const paymentTypeSchema = z.enum([
  "anuidade",
  "mensalidade",
  "inscricao",
  "transferencia",
  "contribuicao",
  "cadastro_governamental",
]);

const paymentMethodSchema = z.enum([
  "dinheiro",
  "pix",
  "transferencia",
  "boleto",
  "cartao",
]);

export const paymentItemSchema = z.object({
  tipo: paymentTypeSchema,
  tipo_cobranca_id: z.string().uuid().optional(),
  competencia_ano: z.number().int().optional(),
  competencia_mes: z.number().int().min(1).max(12).optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  descricao: z.string().optional(),
});

export const daeItemSchema = z.object({
  tipo_boleto: z.enum(["unitario", "agrupado", "anual"]),
  competencia_ano: z.number().int(),
  competencia_mes: z.number().int().min(1).max(12),
  valor: z.number().positive("Valor deve ser positivo"),
  grupo_id: z.string().uuid().optional(),
});

export const paymentSessionSchema = z.object({
  items: z.array(paymentItemSchema).min(1, "Adicione ao menos um item"),
  daes: z.array(daeItemSchema).optional(),
  paymentMethod: paymentMethodSchema,
  paymentDate: z.string().min(1, "Data é obrigatória"),
});

export type PaymentSessionForm = z.infer<typeof paymentSessionSchema>;
