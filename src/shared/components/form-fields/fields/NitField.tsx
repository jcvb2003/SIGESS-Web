import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface NitFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
}
export function NitField<T extends FieldValues>({
  control,
  name,
  label = "NIS/NIT/PIS",
  placeholder = "###.#####.##-#",
  description,
  className,
  readOnly,
}: Readonly<NitFieldProps<T>>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      mask={masks.nit}
      maxLength={14}
    />
  );
}
