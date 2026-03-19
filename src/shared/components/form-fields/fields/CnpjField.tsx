import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface CnpjFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
}
export function CnpjField<T extends FieldValues>({
  control,
  name,
  label = "CNPJ",
  placeholder = "00.000.000/0000-00",
  description,
  className,
  readOnly,
}: CnpjFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      mask={masks.cnpj}
    />
  );
}
