
import { Control, FieldValues, Path } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  description?: string
  className?: string
  readOnly?: boolean
  type?: string
  mask?: (value: string) => string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  className,
  readOnly,
  type = "text",
  mask,
  onChange,
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              readOnly={readOnly}
              onChange={(e) => {
                const value = mask ? mask(e.target.value) : e.target.value
                field.onChange(value)
                onChange?.(e)
              }}
              value={field.value || ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
