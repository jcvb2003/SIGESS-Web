import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { PhoneField } from "@/shared/components/form-fields/fields/PhoneField";
import { EntityFormData } from "../../hooks/useEntityValidation";
export function EntityContact() {
  const { control } = useFormContext<EntityFormData>();
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <PhoneField
            control={control}
            name="phone1"
            label="Telefone principal"
            placeholder="(00) 0000-0000"
          />
          <PhoneField
            control={control}
            name="phone2"
            label="Telefone secundário"
            placeholder="(00) 0 0000-0000"
          />
        </div>
        <div className="space-y-2">
          <TextField
            control={control}
            name="email"
            label="E-mail institucional"
            placeholder="contato@exemplo.org"
            type="email"
          />
        </div>
      </CardContent>
    </Card>
  );
}
