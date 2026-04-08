import { z } from "zod";

export const daeSchema = z.object({
  tipoBoleto: z.enum(["unitario", "agrupado", "anual"]),
  competenciaAno: z.number().int(),
  competenciaMes: z.number().int().min(1).max(12),
  valor: z.number().positive("Valor deve ser positivo"),
  formaPagamento: z.enum(["dinheiro", "pix", "transferencia", "boleto", "cartao"]),
  grupoId: z.uuid().optional(),
});

export type DAEForm = z.infer<typeof daeSchema>;
