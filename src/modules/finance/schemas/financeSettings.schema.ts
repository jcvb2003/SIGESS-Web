import { z } from "zod";

export const financeSettingsSchema = z.object({
  regimePadrao: z.enum(["anuidade", "mensalidade"]),
  diaVencimento: z.number().int().min(1).max(28),
  anoBaseCobranca: z.number().int().min(2000).max(2099),
  valorAnuidade: z.number().min(0).optional().nullable(),
  valorMensalidade: z.number().min(0).optional().nullable(),
  valorInscricao: z.number().min(0).optional().nullable(),
  valorTransferencia: z.number().min(0).optional().nullable(),
  bloquearInadimplente: z.boolean(),
  anosAtrasoAlerta: z.number().int().min(1).max(10),
});

export type FinanceSettingsForm = z.infer<typeof financeSettingsSchema>;
