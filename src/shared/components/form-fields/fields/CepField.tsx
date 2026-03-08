import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface CepFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
}
export function CepField<T extends FieldValues>({
  control,
  name,
  label = "CEP",
  placeholder = "00000-000",
  description,
  className,
  readOnly,
}: CepFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      mask={masks.cep}
    />
  );
}
