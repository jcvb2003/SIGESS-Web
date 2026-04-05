import { useState } from "react";
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
import { Button } from "@/shared/components/ui/button";
import { useLocalitiesData } from "../../hooks/data/useLocalitiesData";
import { MapPin, Plus } from "lucide-react";
import { LocalityManagementDialog } from "@/modules/settings/components/data/LocalityManagementDialog";

export function AddressForm() {
  const { control, setValue } = useFormContext();
  const [isLocalityDialogOpen, setIsLocalityDialogOpen] = useState(false);
  const { localities, loading } = useLocalitiesData();

  const localityOptions = localities
    .filter((locality) => locality.code)
    .map((locality) => ({
      label: locality.name,
      value: locality.code,
    }));

  const handleLocalityCreated = (code: string) => {
    setValue("codigoLocalidade", code, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <>
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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SelectField
                  control={control}
                  name="codigoLocalidade"
                  label="Localidade"
                  placeholder={loading ? "Carregando..." : "Selecione uma localidade"}
                  options={localityOptions}
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mb-[2px] transition-all active:scale-95"
                onClick={() => setIsLocalityDialogOpen(true)}
                title="Gerenciar localidades"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LocalityManagementDialog
        open={isLocalityDialogOpen}
        onOpenChange={setIsLocalityDialogOpen}
        onCreated={handleLocalityCreated}
      />
    </>
  );
}
