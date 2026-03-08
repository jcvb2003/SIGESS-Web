import { Control, FieldValues, Path } from "react-hook-form";
import { TextField } from "./TextField";
import { masks } from "@/shared/utils/masks/inputMasks";
interface CaepfFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
}
export function CaepfField<T extends FieldValues>({
  control,
  name,
  label = "CAEPF",
  placeholder = "###.###.###/###-##",
  description,
  className,
  readOnly,
}: CaepfFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      mask={masks.caepf}
      maxLength={18}
    />
  );
}
