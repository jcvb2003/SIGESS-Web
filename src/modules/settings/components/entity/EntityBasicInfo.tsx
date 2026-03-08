import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { CnpjField } from "@/shared/components/form-fields/fields/CnpjField";
import { EntityFormData } from "../../hooks/useEntityValidation";
export function EntityBasicInfo() {
  const { control } = useFormContext<EntityFormData>();
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Dados Básicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={control}
            name="name"
            label="Nome completo da entidade"
            placeholder="Nome do sindicato"
            autoUppercase={true}
          />
          <TextField
            control={control}
            name="shortName"
            label="Nome abreviado"
            placeholder="Sigla / abreviação"
            autoUppercase={true}
          />
        </div>
        <div className="space-y-2 md:max-w-sm">
          <CnpjField control={control} name="cnpj" />
        </div>
      </CardContent>
    </Card>
  );
}
