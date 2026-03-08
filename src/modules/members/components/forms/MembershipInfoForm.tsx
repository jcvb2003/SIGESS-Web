
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { TextField } from "@/shared/components/form-fields/fields/TextField"
import { DateField } from "@/shared/components/form-fields/fields/DateField"
import { SelectField } from "@/shared/components/form-fields/fields/SelectField"
import { TextareaField } from "@/shared/components/form-fields/fields/TextareaField"
import { useLocalitiesData } from "@/modules/settings/hooks/useLocalitiesData"
import { masks } from "@/shared/utils/masks"

export function MembershipInfoForm() {
  const { control } = useFormContext()
  const { localities, loading } = useLocalitiesData()

  const localityOptions = localities.map((locality) => ({
    label: `${locality.code} - ${locality.name}`,
    value: locality.code,
  }))

  const situationOptions = [
    { label: "ATIVO", value: "1 - ATIVO" },
    { label: "APOSENTADO", value: "2 - APOSENTADO" },
    { label: "FALECIDO", value: "3 - FALECIDO" },
    { label: "TRANSFERIDO", value: "4 - TRANSFERIDO" },
    { label: "CANCELADO", value: "5 - CANCELADO" },
    { label: "SUSPENSO", value: "6 - SUSPENSO" },
  ]

  const situationMpaOptions = [
    { label: "ATIVO", value: "ATIVO" },
    { label: "SUSPENSO", value: "SUSPENSO" },
  ]

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Informações de registro</CardTitle>
        <CardDescription>
          Código de registro, filiação e vinculação do sócio à entidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            control={control}
            name="codigoDoSocio"
            label="Código do sócio"
            placeholder="Número de registro"
            mask={masks.numbers}
          />

          <DateField
            control={control}
            name="dataDeAdmissao"
            label="Data de filiação"
          />

          <SelectField
            control={control}
            name="codigoLocalidade"
            label="Localidade"
            placeholder={loading ? "Carregando..." : "Selecione a localidade"}
            options={localityOptions}
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            control={control}
            name="situacao"
            label="Situação"
            placeholder="Selecione a situação"
            options={situationOptions}
          />

          <SelectField
            control={control}
            name="situacaoMpa"
            label="Situação MPA"
            placeholder="Selecione a situação MPA"
            options={situationMpaOptions}
          />
        </div>

        <TextareaField
            control={control}
            name="observacoes"
            label="Observações"
            placeholder="Observações gerais sobre o cadastro"
        />
      </CardContent>
    </Card>
  )
}
