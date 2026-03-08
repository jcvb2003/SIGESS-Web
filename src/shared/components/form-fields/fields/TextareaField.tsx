import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Textarea } from "@/shared/components/ui/textarea";
import { useFieldBackgroundColors } from "@/shared/hooks/useFieldBackgroundColors";
interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
  autoUppercase?: boolean;
}
export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  className,
  readOnly,
  autoUppercase,
}: TextareaFieldProps<T>) {
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
            <Textarea
              {...field}
              placeholder={placeholder}
              readOnly={readOnly}
              value={field.value || ""}
              className={`${bgColor} ${autoUppercase ? "uppercase" : ""}`.trim()}
              onChange={(e) => {
                const value = autoUppercase
                  ? e.target.value.toUpperCase()
                  : e.target.value;
                field.onChange(value);
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
