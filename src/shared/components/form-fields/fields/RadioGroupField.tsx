import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { useFieldBackgroundColors } from "@/shared/hooks/useFieldBackgroundColors";
export interface RadioOption {
  label: string;
  value: string;
}
interface RadioGroupFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  options: RadioOption[];
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  direction?: "horizontal" | "vertical";
}
export function RadioGroupField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  options,
  className,
  disabled,
  onChange,
  direction = "horizontal",
}: RadioGroupFieldProps<T>) {
  const { getFieldBackgroundColor } = useFieldBackgroundColors();
  const bgColor = getFieldBackgroundColor(name);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => {
                field.onChange(value);
                onChange?.(value);
              }}
              defaultValue={field.value}
              value={field.value}
              disabled={disabled}
              className={`flex rounded-md border px-3 ${bgColor} ${direction === "horizontal" ? "flex-row space-x-4 h-9 items-center" : "flex-col space-y-2 py-2 mt-2"}`}
            >
              {options.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-center space-x-2 space-y-0"
                >
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    {option.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
