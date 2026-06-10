import { Control, FieldValues, Path, useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useFieldBackgroundColors } from "@/shared/hooks/useFieldBackgroundColors";
export interface SelectOption {
  label: string;
  value: string;
}
interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  options,
  className,
  disabled,
  onChange,
}: SelectFieldProps<T>) {
  const { getFieldBackgroundColor } = useFieldBackgroundColors();
  const bgColor = getFieldBackgroundColor(name);
  const watchedValue = useWatch({ control, name }) as string | undefined;
  const selectedLabel = options.find((o) => o.value === watchedValue)?.label;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onChange?.(value);
            }}
            value={watchedValue || undefined}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className={bgColor}>
                {selectedLabel ? (
                  <span>{selectedLabel}</span>
                ) : (
                  <SelectValue placeholder={placeholder} />
                )}
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
