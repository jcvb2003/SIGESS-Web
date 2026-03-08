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
import { StateSelect } from "@/shared/components/form-fields/fields/StateSelect";
import { NitField } from "@/shared/components/form-fields/fields/NitField";
import { CaepfField } from "@/shared/components/form-fields/fields/CaepfField";
import { ElectoralZoneField } from "@/shared/components/form-fields/fields/ElectoralZoneField";
import { ElectoralSectionField } from "@/shared/components/form-fields/fields/ElectoralSectionField";
import { SelectField } from "@/shared/components/form-fields/fields/SelectField";
import { masks } from "@/shared/utils/masks/inputMasks";
import { FileText } from "lucide-react";
import { Separator } from "@/shared/components/ui/separator";
export function MemberDocumentsForm() {
  const { control } = useFormContext();
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileText className="h-4.5 w-4.5 text-primary/70" />
          Documentos
        </CardTitle>
        <CardDescription>Documentação pessoal e profissional.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Identidade
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              control={control}
              name="rg"
              label="RG"
              placeholder="RG"
              autoUppercase
            />
            <DateField
              control={control}
              name="dataExpedicaoRg"
              label="Data de Expedição RG"
            />
            <StateSelect
              control={control}
              name="ufRg"
              label="UF RG"
              placeholder="Selecione"
            />
          </div>
        </div>

        <Separator className="bg-border/30" />

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Título de Eleitor
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              control={control}
              name="tituloEleitor"
              label="Título de Eleitor"
              placeholder="0000 0000 0000"
              mask={masks.electoralTitle}
              maxLength={14}
            />
            <ElectoralZoneField control={control} name="zonaEleitoral" />
            <ElectoralSectionField control={control} name="secaoEleitoral" />
          </div>
        </div>

        <Separator className="bg-border/30" />

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Registros Profissionais
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <NitField control={control} name="nit" />
            <TextField
              control={control}
              name="cei"
              label="CEI"
              placeholder="00.000.00000/00"
              mask={masks.cei}
              maxLength={15}
              autoUppercase
            />
            <CaepfField control={control} name="caepf" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              control={control}
              name="rgp"
              label="RGP"
              placeholder="RGP"
              maxLength={15}
              autoUppercase
            />
            <SelectField
              control={control}
              name="tipoRgp"
              label="Tipo de RGP"
              placeholder="Selecione"
              options={[
                { label: "Selecione", value: "NONE" },
                { label: "Inicial", value: "INICIAL" },
                { label: "Protocolo", value: "PROTOCOLO" },
                { label: "Recadastramento", value: "RECADASTRAMENTO" },
              ]}
            />
            <DateField
              control={control}
              name="emissaoRgp"
              label="Data Emissão RGP"
            />
            <StateSelect
              control={control}
              name="ufRgp"
              label="UF RGP"
              placeholder="PA"
            />
          </div>
        </div>

        <Separator className="bg-border/30" />

        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Acesso Gov.br
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              control={control}
              name="senhaGovInss"
              label="Senha Gov/INSS"
              placeholder="Senha"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
