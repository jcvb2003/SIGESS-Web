import { z } from "zod";

export const chargeTypeSchema = z
  .object({
    categoria: z.enum(["contribuicao", "cadastro_governamental"]),
    nome: z.string().min(1, "Nome é obrigatório"),
    descricao: z.string().optional().nullable(),
    valorPadrao: z
      .number()
      .nonnegative("Valor não pode ser negativo")
      .optional()
      .nullable(),
    obrigatoriedade: z
      .enum(["compulsoria", "facultativa"])
      .nullable()
      .optional(),
    ativo: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.categoria === "contribuicao" && !data.obrigatoriedade) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Obrigatoriedade é obrigatória para contribuições",
        path: ["obrigatoriedade"],
      });
    }
  });

export type ChargeTypeFormValues = z.infer<typeof chargeTypeSchema>;
