import { z } from "zod";
export const entitySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  shortName: z.string().optional(),
  cnpj: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  cep: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Email inválido",
  }),
  federation: z.string().optional(),
  confederation: z.string().optional(),
  pole: z.string().optional(),
  foundation: z.string().optional(),
  county: z.string().optional(),
  presidentName: z.string().optional(),
  presidentCpf: z.string().optional(),
});
export type EntityFormData = z.infer<typeof entitySchema>;
