import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useFormContext } from "react-hook-form";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { DateField } from "@/shared/components/form-fields/fields/DateField";

export function FishingPeriodsSection() {
  const { control } = useFormContext();

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Períodos de Defeso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <DateField
            control={control}
            name="defeso1Start"
            label="Início do 1º período"
          />
          <DateField
            control={control}
            name="defeso1End"
            label="Fim do 1º período"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <DateField
            control={control}
            name="defeso2Start"
            label="Início do 2º período"
          />
          <DateField
            control={control}
            name="defeso2End"
            label="Fim do 2º período"
          />
        </div>
        <TextField
          control={control}
          name="defesoSpecies"
          label="Espécies abrangidas"
          placeholder="Lista de espécies em defeso"
        />
      </CardContent>
    </Card>
  );
}
