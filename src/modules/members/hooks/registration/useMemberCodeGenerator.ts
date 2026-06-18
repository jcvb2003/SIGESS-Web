import { useEffect, useCallback } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";
import { memberService } from "../../services/memberService";
import {
  isSuggestedMemberCode,
  extractBirthMonth,
  buildSuggestedCode,
} from "../../domain/memberCode";

export { REGISTRATION_CODE_PATTERN } from "../../domain/memberCode";

export function useMemberCodeGenerator(
  form: UseFormReturn<MemberRegistrationSchemaType>,
  isEditing: boolean,
) {
  const suggestCode = async (birthdate: string): Promise<string> => {
    if (birthdate?.length !== 10) return "";
    try {
      const prefix = `${extractBirthMonth(birthdate)}0`;
      const lastCode = await memberService.getLastRegistrationNumber(prefix);
      return buildSuggestedCode(prefix, lastCode);
    } catch (error) {
      toast.error("Ocorreu um erro ao gerar o código do sócio. Por favor, tente novamente.");
      console.error("Error generating member code:", error);
      return "";
    }
  };

  const handleGenerateCode = useCallback(async () => {
    const currentCode = form.getValues("codigoDoSocio");
    if (isSuggestedMemberCode(currentCode)) return;

    const birthdate = form.getValues("dataDeNascimento");
    if (birthdate?.length !== 10) {
      toast.info("Por favor, preencha a data de nascimento primeiro.");
      return;
    }

    const suggested = await suggestCode(birthdate);
    if (suggested) {
      form.setValue("codigoDoSocio", suggested, { shouldValidate: true });
      toast.success("Código de registro gerado com sucesso!");
    }
  }, [form]);

  const dataDeNascimento = useWatch({
    control: form.control,
    name: "dataDeNascimento",
  });

  useEffect(() => {
    // Geração automática apenas em criação (não edição)
    if (isEditing) return;
    if (dataDeNascimento?.length !== 10) return;

    const autoSuggest = async () => {
      const currentCode = form.getValues("codigoDoSocio");
      if (isSuggestedMemberCode(currentCode)) return; // preserva código já gerado

      const suggested = await suggestCode(dataDeNascimento);
      if (suggested) {
        form.setValue("codigoDoSocio", suggested, { shouldValidate: true });
      }
    };

    autoSuggest();
  }, [dataDeNascimento, isEditing, form]);

  return { handleGenerateCode };
}
