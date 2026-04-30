import { useFormContext } from "react-hook-form";

export function useFieldBackgroundColors() {
  const { watch, formState: { errors } } = useFormContext();

  const getFieldBackgroundColor = (fieldName: string): string => {
    // Inscrição granular para o campo específico
    const fieldValue = watch(fieldName);
    const hasError = !!errors[fieldName];

    if (hasError) {
      return "";
    }

    if (fieldValue && fieldValue.toString().trim() !== "") {
      return "bg-emerald-50 border-emerald-200 focus:bg-emerald-50 focus:border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800 dark:focus:bg-emerald-950/40 dark:focus:border-emerald-600 transition-colors duration-200";
    }

    return "bg-sky-50 border-sky-200 focus:bg-sky-50 focus:border-sky-400 dark:bg-sky-950/30 dark:border-sky-800 dark:focus:bg-sky-950/40 dark:focus:border-sky-600 transition-colors duration-200";
  };

  return { getFieldBackgroundColor };
}
