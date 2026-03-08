import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useFormContext } from "react-hook-form";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { DateField } from "@/shared/components/form-fields/fields/DateField";

export function PublicationSection() {
  const { control } = useFormContext();

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">
          Publicação Oficial e Área de Pesca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            control={control}
            name="publicationNumber"
            label="Número da publicação"
            placeholder="0000"
          />
          <DateField
            control={control}
            name="publicationDate"
            label="Data da publicação"
          />
          <TextField
            control={control}
            name="publicationLocal"
            label="Local da pesca"
            placeholder="Rio, Lago, etc."
          />
        </div>
        <TextField
          control={control}
          name="fishingArea"
          label="Área de pesca"
          placeholder="Ex.: Águas interiores da região de ..."
        />
      </CardContent>
    </Card>
  );
}
