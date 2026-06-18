import { useFormContext } from "react-hook-form";

export function useFieldBackgroundColors() {
  const { watch, formState: { errors } } = useFormContext();

  const getFieldBackgroundColor = (fieldName: string): string => {
    const fieldValue = watch(fieldName);
    const hasError = !!errors[fieldName];

    if (hasError) {
      return "";
    }

    if (fieldValue && fieldValue.toString().trim() !== "") {
      return "bg-success/5 border-success/20 focus:bg-success/5 focus:border-success/40 dark:bg-success/10 dark:border-success/30 dark:focus:bg-success/10 dark:focus:border-success/50 transition-colors duration-200";
    }

    return "bg-empty/10 border-empty/20 focus:bg-empty/10 focus:border-empty/40 dark:bg-empty/10 dark:border-empty/20 dark:focus:bg-empty/10 dark:focus:border-empty/40 transition-colors duration-200";
  };

  return { getFieldBackgroundColor };
}
