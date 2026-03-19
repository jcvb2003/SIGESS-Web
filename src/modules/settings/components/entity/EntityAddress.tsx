import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { CepField } from "@/shared/components/form-fields/fields/CepField";
import { StateSelect } from "@/shared/components/form-fields/fields/StateSelect";
import { EntityFormData } from "../../hooks/useEntityValidation";
export function EntityAddress() {
  const { control } = useFormContext<EntityFormData>();
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Endereço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <CepField control={control} name="cep" />
          </div>
          <div className="md:col-span-2">
            <TextField
              control={control}
              name="street"
              label="Logradouro"
              placeholder="Rua, Avenida, etc."
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <TextField
              control={control}
              name="number"
              label="Número"
              placeholder="123"
            />
          </div>
          <div className="md:col-span-2">
            <TextField
              control={control}
              name="district"
              label="Bairro"
              placeholder="Bairro"
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <TextField
              control={control}
              name="city"
              label="Cidade"
              placeholder="Nome da cidade"
            />
          </div>
          <div className="md:col-span-1">
            <StateSelect
              control={control}
              name="state"
              label="UF"
              placeholder="UF"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
