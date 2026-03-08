
import { Control, FieldValues, Path } from "react-hook-form"
import { TextField } from "./TextField"
import { masks } from "@/shared/utils/masks"

interface PhoneFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label?: string
  placeholder?: string
  description?: string
  className?: string
  readOnly?: boolean
}

export function PhoneField<T extends FieldValues>({
  control,
  name,
  label = "Telefone",
  placeholder = "(00) 00000-0000",
  description,
  className,
  readOnly,
}: PhoneFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      description={description}
      className={className}
      readOnly={readOnly}
      mask={masks.phone}
    />
  )
}
