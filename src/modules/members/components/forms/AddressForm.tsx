import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TextField } from "@/shared/components/form-fields/fields/TextField";
import { CepField } from "@/shared/components/form-fields/fields/CepField";
import { PhoneField } from "@/shared/components/form-fields/fields/PhoneField";
import { StateSelect } from "@/shared/components/form-fields/fields/StateSelect";
import { SelectField } from "@/shared/components/form-fields/fields/SelectField";
import { useLocalitiesData } from "../../hooks/data/useLocalitiesData";
import { MapPin } from "lucide-react";
export function AddressForm() {
  const { control } = useFormContext();
  const { localities, loading } = useLocalitiesData();
  const localityOptions = localities
    .filter((locality) => locality.code)
    .map((locality) => ({
      label: locality.name,
      value: locality.code,
    }));
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-4.5 w-4.5 text-primary/70" />
          Endereço e Contato
        </CardTitle>
        <CardDescription>
          Informações de localização e contato do sócio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <TextField
            control={control}
            name="endereco"
            label="Endereço"
            placeholder="Rua, avenida, travessa..."
            autoUppercase
          />
          <TextField
            control={control}
            name="numero"
            label="Número"
            placeholder="Número da residência"
            autoUppercase
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            control={control}
            name="bairro"
            label="Bairro"
            placeholder="Nome do bairro"
            autoUppercase
          />
          <TextField
            control={control}
            name="cidade"
            label="Cidade"
            placeholder="Nome da cidade"
            autoUppercase
          />
          <StateSelect
            control={control}
            name="uf"
            label="Estado (UF)"
            placeholder="Selecione o estado"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CepField control={control} name="cep" label="CEP" />
          <PhoneField
            control={control}
            name="telefone"
            label="Telefone"
            placeholder="(00) 00000-0000"
          />
          <TextField
            control={control}
            name="email"
            label="E-mail"
            placeholder="exemplo@email.com"
            autoLowercase
          />
          <SelectField
            control={control}
            name="codigoLocalidade"
            label="Localidade"
            placeholder={loading ? "Carregando..." : "Selecione uma localidad"}
            options={localityOptions}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
