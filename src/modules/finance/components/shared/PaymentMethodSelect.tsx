import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { PAYMENT_METHODS } from "./constants";
import type { PaymentMethod } from "../../types/finance.types";

interface PaymentMethodSelectProps {
  readonly value: PaymentMethod;
  readonly onChange: (value: PaymentMethod) => void;
  readonly label?: string;
}

/**
 * Select padronizado de formas de pagamento.
 * Fonte única para os 5 métodos (Dinheiro, PIX, Transferência, Boleto, Cartão).
 */
export function PaymentMethodSelect({
  value,
  onChange,
  label = "Forma de Pagamento",
}: PaymentMethodSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as PaymentMethod)}
      >
        <SelectTrigger className="h-10 text-xs border-slate-200 focus:ring-emerald-500 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_METHODS.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
