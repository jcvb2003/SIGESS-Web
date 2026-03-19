import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { DateField } from "@/shared/components/form-fields/fields/DateField";
import { SelectField } from "@/shared/components/form-fields/fields/SelectField";
import { TextareaField } from "@/shared/components/form-fields/fields/TextareaField";
import { masks } from "@/shared/utils/masks/inputMasks";
import { MemberPhotoField } from "../form-fields/MemberPhotoField";
import { ClipboardList } from "lucide-react";
export function MembershipInfoForm() {
  const { control } = useFormContext();
  const situationOptions = [
    { label: "ATIVO", value: "ATIVO" },
    { label: "APOSENTADO", value: "APOSENTADO" },
    { label: "FALECIDO", value: "FALECIDO" },
    { label: "TRANSFERIDO", value: "TRANSFERIDO" },
    { label: "CANCELADO", value: "CANCELADO" },
    { label: "SUSPENSO", value: "SUSPENSO" },
  ];
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ClipboardList className="h-4.5 w-4.5 text-primary/70" />
          Informações de Registro
        </CardTitle>
        <CardDescription>
          Código de registro, filiação e vinculação do sócio à entidade.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex justify-center sm:justify-start shrink-0">
            <MemberPhotoField />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <TextField
                control={control}
                name="codigoDoSocio"
                label="Número de Registro"
                placeholder="Número de registro do sócio"
                mask={masks.numbers}
              />
              <DateField
                control={control}
                name="dataDeAdmissao"
                label="Data de Cadastro"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <SelectField
                control={control}
                name="situacao"
                label="Situação"
                placeholder="Selecione a situação"
                options={situationOptions}
              />
            </div>
          </div>
        </div>

        <TextareaField
          control={control}
          name="observacoes"
          label="Observações"
          placeholder="Observações sobre o sócio"
        />
      </CardContent>
    </Card>
  );
}
