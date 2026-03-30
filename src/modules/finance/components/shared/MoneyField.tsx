import { useEffect, useState } from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatNumericInput } from "./formatters";

interface MoneyFieldProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (val: number) => void;
  readonly className?: string;
}

/**
 * Input monetário com máscara de preenchimento progressivo.
 * Gerencia dígitos e formatação em tempo real.
 */
export function MoneyField({
  label,
  value,
  onChange,
  className,
}: MoneyFieldProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    setDisplayValue(formatNumericInput(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replaceAll(/\D/g, "");
    const numericValue = Number(digits) / 100;
    onChange(numericValue);
    setDisplayValue(formatNumericInput(numericValue));
  };

  return (
    <div className={className ?? "space-y-1.5"}>
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          R$
        </span>
        <Input
          type="text"
          inputMode="numeric"
          className="h-9 pl-8 text-xs focus-visible:ring-emerald-500"
          value={displayValue}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
        />
      </div>
    </div>
  );
}
