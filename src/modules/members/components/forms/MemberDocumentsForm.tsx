
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { TextField } from "@/shared/components/form-fields/fields/TextField"
import { DateField } from "@/shared/components/form-fields/fields/DateField"
import { StateSelect } from "@/shared/components/form-fields/fields/StateSelect"
import { masks } from "@/shared/utils/masks"

export function MemberDocumentsForm() {
  const { control } = useFormContext()

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Documentos</CardTitle>
        <CardDescription>Documentação pessoal e profissional.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField control={control} name="rg" label="RG" placeholder="Número do RG" />
          <DateField control={control} name="dataExpedicaoRg" label="Data de Expedição" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StateSelect control={control} name="ufRg" label="UF do RG" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextField control={control} name="tituloEleitor" label="Título de Eleitor" mask={masks.numbers} />
          <TextField control={control} name="zonaEleitoral" label="Zona Eleitoral" mask={masks.numbers} />
          <TextField control={control} name="secaoEleitoral" label="Seção Eleitoral" mask={masks.numbers} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <TextField control={control} name="nit" label="NIT/PIS/PASEP" mask={masks.numbers} />
            <TextField control={control} name="caepf" label="CAEPF" mask={masks.numbers} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <TextField control={control} name="rgp" label="RGP" />
            <DateField control={control} name="emissaoRgp" label="Emissão do RGP" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
             <StateSelect control={control} name="ufRgp" label="UF do RGP" />
             <TextField control={control} name="senhaGovInss" label="Senha Gov.br/INSS" />
        </div>
      </CardContent>
    </Card>
  )
}
