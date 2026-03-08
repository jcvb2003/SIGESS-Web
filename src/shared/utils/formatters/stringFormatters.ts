import { masks } from "../masks/inputMasks";

/**
 * Formata um CPF ou retorna um traço se nulo/vazio
 */
export const formatCpfOrDash = (value: string | null | undefined): string => {
  if (!value) return "-";
  return masks.cpf(value);
};

/**
 * Formata um CPF
 */
export const formatCpf = (value: string | null | undefined): string => {
  if (!value) return "";
  return masks.cpf(value);
};
