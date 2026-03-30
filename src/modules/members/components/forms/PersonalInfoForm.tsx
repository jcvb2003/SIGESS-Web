import { useFormContext, useWatch } from "react-hook-form";
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
import { CpfField } from "@/shared/components/form-fields/fields/CpfField";
import { RadioGroupField } from "@/shared/components/form-fields/fields/RadioGroupField";
import { StateSelect } from "@/shared/components/form-fields/fields/StateSelect";
import { UserCircle } from "lucide-react";
export function PersonalInfoForm() {
  const { control } = useFormContext();
  const [alfabetizado] = useWatch({ name: ["alfabetizado"] });
  const sexoOptions = [
    { label: "MASCULINO", value: "MASCULINO" },
    { label: "FEMININO", value: "FEMININO" },
  ];
  const estadoCivilOptions = [
    { label: "SOLTEIRO(A)", value: "Solteiro(a)" },
    { label: "CASADO(A)", value: "Casado(a)" },
    { label: "DIVORCIADO(A)", value: "Divorciado(a)" },
    { label: "VIÚVO(A)", value: "Viúvo(a)" },
    { label: "UNIÃO ESTÁVEL", value: "União Estável" },
  ];
  const alfabetizadoOptions = [
    { label: "SIM", value: "SIM" },
    { label: "NÃO", value: "NÃO" },
  ];
  const escolaridadeOptions = [
    { label: "FUNDAMENTAL INCOMPLETO", value: "FUNDAMENTAL INCOMPLETO" },
    { label: "FUNDAMENTAL COMPLETO", value: "FUNDAMENTAL COMPLETO" },
    { label: "MÉDIO INCOMPLETO", value: "MÉDIO INCOMPLETO" },
    { label: "MÉDIO COMPLETO", value: "MÉDIO COMPLETO" },
    { label: "SUPERIOR INCOMPLETO", value: "SUPERIOR INCOMPLETO" },
    { label: "SUPERIOR COMPLETO", value: "SUPERIOR COMPLETO" },
    { label: "OUTRO", value: "OUTRO" },
  ];
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <UserCircle className="h-4.5 w-4.5 text-primary/70" />
          Dados Pessoais
        </CardTitle>
        <CardDescription>Informações básicas do sócio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <CpfField control={control} name="cpf" label="CPF" />
          <TextField
            control={control}
            name="nome"
            label="Nome completo"
            placeholder="Nome completo do sócio"
            autoUppercase
          />
          <TextField
            control={control}
            name="apelido"
            label="Apelido"
            placeholder="Apelido ou nome conhecido"
            autoUppercase
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <DateField
            control={control}
            name="dataDeNascimento"
            label="Data de nascimento"
          />
          <RadioGroupField
            control={control}
            name="sexo"
            label="Sexo"
            options={sexoOptions}
          />
          <SelectField
            control={control}
            name="estadoCivil"
            label="Estado Civil"
            options={estadoCivilOptions}
            placeholder="Selecione"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={control}
            name="pai"
            label="Nome do pai"
            placeholder="Nome completo do pai"
            autoUppercase
          />
          <TextField
            control={control}
            name="mae"
            label="Nome da mãe"
            placeholder="Nome completo da mãe"
            autoUppercase
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <TextField
            control={control}
            name="nacionalidade"
            label="Nacionalidade"
            placeholder="Ex: Brasileira"
            autoUppercase
          />
          <TextField
            control={control}
            name="naturalidade"
            label="Naturalidade"
            placeholder="Cidade de nascimento"
            autoUppercase
          />
          <StateSelect
            control={control}
            name="ufNaturalidade"
            label="UF de Nascimento"
            placeholder="Estado de nascimento"
          />
          <RadioGroupField
            control={control}
            name="alfabetizado"
            label="Alfabetizado"
            options={alfabetizadoOptions}
          />
        </div>

        <div className={alfabetizado === "SIM" ? "grid gap-4 sm:grid-cols-1" : "hidden"}>
            <SelectField
              control={control}
              name="escolaridade"
              label="Escolaridade"
              options={escolaridadeOptions}
              placeholder="Selecione"
            />
        </div>
      </CardContent>
    </Card>
  );
}
