import { useState, useEffect } from "react";
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
import { usePortariasData } from "../../hooks/data/usePortariasData";
import { MapPin, Plus } from "lucide-react";
import { LocalityManagementDialog } from "@/modules/settings/components/data/LocalityManagementDialog";
import { useCoordinatorsData } from "@/modules/coordinators/hooks/useCoordinatorsData";

export function AddressForm() {
  const { control, setValue, trigger } = useFormContext();
  const [isLocalityDialogOpen, setIsLocalityDialogOpen] = useState(false);
  const { localities, loading } = useLocalitiesData();
  const { portarias } = usePortariasData();
  const { coordinators } = useCoordinatorsData();
  const hasMultiplePortarias = portarias.length >= 2;

  const localityOptions = localities
    .filter((locality) => !!locality.code)
    .map((locality) => ({
      label: locality.name,
      value: locality.code as string,
    }));

  const portariaOptions = portarias.map((p) => ({
    label: `${p.codigoPortaria} - ${p.nome}`,
    value: p.id!,
  }));

  const coordinatorOptions = coordinators.map((coordinator) => ({
    label: coordinator.name,
    value: coordinator.id ?? "",
  }));

  // Revalida portariaId quando o threshold muda (RHF não reage ao resolver sozinho)
  useEffect(() => {
    void trigger("portariaId");
  }, [hasMultiplePortarias, trigger]);

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

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              control={control}
              name="coordinatorId"
              label="Coordenador"
              placeholder={
                coordinators.length > 0
                  ? "Selecione o coordenador"
                  : "Nenhum coordenador cadastrado"
              }
              options={[
                { label: "Sem coordenador", value: "__none__" },
                ...coordinatorOptions,
              ]}
              onChange={(value) => {
                if (value === "__none__") {
                  setValue("coordinatorId", "", {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }
              }}
            />
          </div>

          {hasMultiplePortarias && (
            <SelectField
              control={control}
              name="portariaId"
              label="Portaria"
              placeholder="Selecione a portaria"
              options={portariaOptions}
            />
          )}
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
