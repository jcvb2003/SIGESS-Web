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
      return "bg-success/15 border-success/35 focus:bg-success/15 focus:border-success/55 dark:bg-success/15 dark:border-success/35 dark:focus:bg-success/15 dark:focus:border-success/55 transition-colors duration-200";
    }

    return "bg-empty/20 border-empty/40 focus:bg-empty/20 focus:border-empty/60 dark:bg-empty/20 dark:border-empty/40 dark:focus:bg-empty/20 dark:focus:border-empty/60 transition-colors duration-200";
  };

  return { getFieldBackgroundColor };
}
