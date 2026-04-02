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
import { TextareaField } from "@/shared/components/form-fields/fields/TextareaField";
import { masks } from "@/shared/utils/masks/inputMasks";
import { MemberPhotoField } from "../form-fields/MemberPhotoField";
import { ClipboardList, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useMemberCodeGenerator, REGISTRATION_CODE_PATTERN } from "../../hooks/registration/useMemberCodeGenerator";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";

interface MembershipInfoFormProps {
  isEditMode: boolean;
}

export function MembershipInfoForm({ isEditMode }: Readonly<MembershipInfoFormProps>) {
  const form = useFormContext<MemberRegistrationSchemaType>();
  const { control } = form;
  const { handleGenerateCode } = useMemberCodeGenerator(form, isEditMode);
  
  const codigoDoSocio = useWatch({ control, name: "codigoDoSocio" });
  const isPatternMatch = !!(codigoDoSocio && REGISTRATION_CODE_PATTERN.test(String(codigoDoSocio)));

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
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField
                    control={control}
                    name="codigoDoSocio"
                    label="Número de Registro"
                    placeholder="Número de registro do sócio"
                    mask={masks.numbers}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mb-[2px] transition-all hover:bg-primary/10 hover:text-primary active:scale-95"
                  onClick={handleGenerateCode}
                  disabled={isPatternMatch}
                  title={isPatternMatch ? "Já está no formato padrão" : "Gerar código"}
                >
                  {isPatternMatch ? (
                    <Sparkles className="h-4 w-4 text-muted-foreground/30" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <DateField
                control={control}
                name="dataDeAdmissao"
                label="Data de filiação"
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
