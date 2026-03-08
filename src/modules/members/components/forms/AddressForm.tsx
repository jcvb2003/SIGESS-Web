
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { TextField } from "@/shared/components/form-fields/fields/TextField"
import { CepField } from "@/shared/components/form-fields/fields/CepField"
import { PhoneField } from "@/shared/components/form-fields/fields/PhoneField"
import { StateSelect } from "@/shared/components/form-fields/fields/StateSelect"

export function AddressForm() {
  const { control } = useFormContext()

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Endereço e Contato</CardTitle>
        <CardDescription>Informações de localização e contato do sócio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <TextField control={control} name="endereco" label="Logradouro" placeholder="Rua, Av., Travessa..." />
          <TextField control={control} name="numero" label="Número" placeholder="S/N" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextField control={control} name="bairro" label="Bairro" placeholder="Bairro" />
          <TextField control={control} name="cidade" label="Cidade" placeholder="Cidade" />
          <StateSelect control={control} name="uf" label="UF" placeholder="UF" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <CepField control={control} name="cep" label="CEP" />
          <PhoneField control={control} name="telefone" label="Telefone" />
          <TextField control={control} name="email" label="E-mail" placeholder="email@exemplo.com" />
        </div>
      </CardContent>
    </Card>
  )
}
