import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface ElectoralSectionFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}
export function ElectoralSectionField<T extends FieldValues>({
  control,
  name,
  label = "Seção Eleitoral",
  placeholder = "0000",
  className,
  readOnly,
}: ElectoralSectionFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      className={className}
      readOnly={readOnly}
      mask={masks.numbers}
      maxLength={4}
      inputMode="numeric"
    />
  );
}
