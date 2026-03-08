import { Control, FieldValues, Path } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useFieldBackgroundColors } from "@/shared/hooks/useFieldBackgroundColors";
interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  className?: string;
  readOnly?: boolean;
  type?: string;
  autoComplete?: string;
  autoUppercase?: boolean;
  autoLowercase?: boolean;
  mask?: (value: string) => string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "email"
    | "url"
    | "search"
    | "none";
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
  autoComplete,
  autoUppercase,
  autoLowercase,
  mask,
  onChange,
  maxLength,
  inputMode,
}: Readonly<TextFieldProps<T>>) {
  const { getFieldBackgroundColor } = useFieldBackgroundColors();
  const bgColor = getFieldBackgroundColor(name as string);
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
          if (mask || autoUppercase || autoLowercase) {
            e.preventDefault();
            let pastedText = e.clipboardData.getData("text");
            if (autoUppercase) pastedText = pastedText.toUpperCase();
            if (autoLowercase) pastedText = pastedText.toLowerCase();
            field.onChange(mask ? mask(pastedText) : pastedText);
          }
        };
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let value = e.target.value;
          if (autoUppercase) value = value.toUpperCase();
          if (autoLowercase) value = value.toLowerCase();
          value = mask ? mask(value) : value;
          field.onChange(value);
          onChange?.(e);
        };
        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  type={type}
                  placeholder={placeholder}
                  readOnly={readOnly}
                  autoComplete={autoComplete}
                  className={`${bgColor} ${autoUppercase ? "uppercase" : ""} ${autoLowercase ? "lowercase" : ""} ${type === "date" ? "pr-10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4" : ""}`.trim()}
                  maxLength={maxLength}
                  inputMode={inputMode}
                  onChange={handleChange}
                  onPaste={handlePaste}
                  value={field.value || ""}
                />
              </FormControl>
              {type === "date" && (
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
              )}
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
