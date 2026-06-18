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
      return "bg-field-filled border-field-filled-border focus:bg-field-filled focus:border-field-filled-border-focus transition-colors duration-200";
    }

    return "bg-field-empty border-field-empty-border focus:bg-field-empty focus:border-field-empty-border-focus transition-colors duration-200";
  };

  return { getFieldBackgroundColor };
}
