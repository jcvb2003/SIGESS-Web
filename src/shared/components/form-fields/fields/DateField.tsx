import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
interface DateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
}
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  className,
  readOnly,
}: DateFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      type="date"
    />
  );
}
