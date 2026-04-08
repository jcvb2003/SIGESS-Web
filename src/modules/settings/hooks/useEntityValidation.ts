import { z } from "zod";
import { optionalDateSchema } from "@/shared/utils/validators/dateValidators";

export const entitySchema = z.object({
  id: z.number().optional(),
  name: z.string().toUpperCase().min(1, "Nome é obrigatório"),
  shortName: z.string().toUpperCase().optional(),
  cnpj: z.string().optional(),
  street: z.string().toUpperCase().optional(),
  number: z.string().toUpperCase().optional(),
  district: z.string().toUpperCase().optional(),
  city: z.string().toUpperCase().optional(),
  state: z.string().toUpperCase().optional(),
  cep: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Email inválido",
  }),
  federation: z.string().toUpperCase().optional(),
  confederation: z.string().toUpperCase().optional(),
  pole: z.string().toUpperCase().optional(),
  foundation: optionalDateSchema,
  county: z.string().toUpperCase().optional(),
  presidentName: z.string().toUpperCase().optional(),
  presidentCpf: z.string().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
  corSidebar: z.string().optional(),
});
export type EntityFormData = z.infer<typeof entitySchema>;
