import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { EntityFormData } from "../../hooks/useEntityValidation";
export function EntityInstitutional() {
  const { control } = useFormContext<EntityFormData>();
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Informações Institucionais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={control}
            name="federation"
            label="Federação"
            placeholder="Nome da federação"
          />
          <TextField
            control={control}
            name="confederation"
            label="Confederação"
            placeholder="Nome da confederação"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={control}
            name="pole"
            label="Polo"
            placeholder="Polo"
          />
          <TextField
            control={control}
            name="foundation"
            label="Fundação"
            placeholder="Data de fundação"
          />
        </div>
        <div className="space-y-2">
          <TextField
            control={control}
            name="county"
            label="Comarca"
            placeholder="Comarca"
          />
        </div>
      </CardContent>
    </Card>
  );
}
