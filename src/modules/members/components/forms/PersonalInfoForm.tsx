
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { TextField } from "@/shared/components/form-fields/fields/TextField"
import { DateField } from "@/shared/components/form-fields/fields/DateField"
import { SelectField } from "@/shared/components/form-fields/fields/SelectField"
import { CpfField } from "@/shared/components/form-fields/fields/CpfField"

export function PersonalInfoForm() {
  const { control } = useFormContext()

  const sexoOptions = [
    { label: "MASCULINO", value: "MASCULINO" },
    { label: "FEMININO", value: "FEMININO" },
    { label: "OUTRO", value: "OUTRO" },
  ]

  const estadoCivilOptions = [
    { label: "SOLTEIRO(A)", value: "SOLTEIRO(A)" },
    { label: "CASADO(A)", value: "CASADO(A)" },
    { label: "DIVORCIADO(A)", value: "DIVORCIADO(A)" },
    { label: "VIÚVO(A)", value: "VIÚVO(A)" },
    { label: "UNIÃO ESTÁVEL", value: "UNIÃO ESTÁVEL" },
  ]

  const alfabetizadoOptions = [
    { label: "SIM", value: "SIM" },
    { label: "NÃO", value: "NÃO" },
  ]

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Dados Pessoais</CardTitle>
        <CardDescription>Informações básicas do sócio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <CpfField control={control} name="cpf" label="CPF" />
          <TextField control={control} name="nome" label="Nome completo" placeholder="Nome do sócio" />
          <TextField control={control} name="apelido" label="Apelido" placeholder="Como é conhecido" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <DateField control={control} name="dataDeNascimento" label="Data de nascimento" />
          <SelectField control={control} name="sexo" label="Sexo" options={sexoOptions} placeholder="Selecione" />
          <SelectField control={control} name="estadoCivil" label="Estado Civil" options={estadoCivilOptions} placeholder="Selecione" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <TextField control={control} name="pai" label="Nome do pai" />
            <TextField control={control} name="mae" label="Nome da mãe" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
            <TextField control={control} name="nacionalidade" label="Nacionalidade" placeholder="BRASILEIRA" />
            <TextField control={control} name="naturalidade" label="Naturalidade" placeholder="Cidade de nascimento" />
            <TextField control={control} name="ufNaturalidade" label="UF Naturalidade" placeholder="UF" />
            <SelectField control={control} name="alfabetizado" label="Alfabetizado" options={alfabetizadoOptions} placeholder="Selecione" />
        </div>
      </CardContent>
    </Card>
  )
}
