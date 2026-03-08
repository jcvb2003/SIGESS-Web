import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface ElectoralZoneFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}
export function ElectoralZoneField<T extends FieldValues>({
  control,
  name,
  label = "Zona Eleitoral",
  placeholder = "000",
  className,
  readOnly,
}: ElectoralZoneFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      className={className}
      readOnly={readOnly}
      mask={masks.numbers}
      maxLength={3}
      inputMode="numeric"
    />
  );
}
