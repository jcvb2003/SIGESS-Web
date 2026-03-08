import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface CpfFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
}
export function CpfField<T extends FieldValues>({
  control,
  name,
  label = "CPF",
  placeholder = "000.000.000-00",
  description,
  className,
  readOnly,
}: CpfFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      mask={masks.cpf}
    />
  );
}
