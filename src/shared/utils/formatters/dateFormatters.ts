import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
export const formatDate = (
  date: string | Date | null | undefined,
  formatStr: string = "dd/MM/yyyy",
): string => {
  if (!date) return "";
  try {
    if (typeof date === "string") {
      const datePart = date.split("T")[0];
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split("-");
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        return format(parsedDate, formatStr, { locale: ptBR });
      }
      return date;
    }
    if (date instanceof Date && isValid(date)) {
      return format(date, formatStr, { locale: ptBR });
    }
    return "";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};
export const formatDateForInput = (date: Date | null): string => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};
export const formatDateForDatabase = (date: Date | null): string => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};
export const calculateAge = (birthDate: string | Date): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
