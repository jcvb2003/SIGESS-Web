import { useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";
import { memberService } from "../../services/memberService";

export const REGISTRATION_CODE_PATTERN = /^\d{2}0\d{3}$/;

export function useMemberCodeGenerator(
  form: UseFormReturn<MemberRegistrationSchemaType>,
  isEditing: boolean,
) {
  const generateRegistrationNumber = async (
    birthdate: string,
  ): Promise<string> => {
    if (birthdate?.length !== 10) return "";
    try {
      const month = birthdate.substring(5, 7);
      const prefix = `${month}0`;
      const latestNumberStr =
        await memberService.getLastRegistrationNumber(prefix);
      let sequenceNumber = 1;
      if (latestNumberStr?.startsWith(prefix)) {
        const sequencePart = latestNumberStr.substring(3);
        sequenceNumber = Number.parseInt(sequencePart ?? "0", 10) + 1;
      }
      const formattedSequence = sequenceNumber.toString().padStart(3, "0");
      return `${prefix}${formattedSequence}`;
    } catch (error) {
      toast.error(
        "Ocorreu um erro ao gerar o código do sócio. Por favor, tente novamente.",
      );
      console.error("Error generating member code:", error);
      return "";
    }
  };

  const handleGenerateCode = useCallback(async () => {
    const currentCode = form.getValues("codigoDoSocio");
    
    // Se já estiver no formato padrão, não faz nada para evitar lacunas
    if (currentCode && REGISTRATION_CODE_PATTERN.test(String(currentCode))) {
      return;
    }

    const birthdate = form.getValues("dataDeNascimento");
    if (birthdate?.length !== 10) {
      toast.info("Por favor, preencha a data de nascimento primeiro.");
      return;
    }

    const generatedCode = await generateRegistrationNumber(birthdate);
    if (generatedCode) {
      form.setValue("codigoDoSocio", generatedCode, {
        shouldValidate: true,
      });
      toast.success("Código de registro gerado com sucesso!");
    }
  }, [form]);

  useEffect(() => {
    // Permitimos a geração automática apenas em modo de criação
    if (isEditing) return;

    const subscription = form.watch(
      async (
        formData: Partial<MemberRegistrationSchemaType>,
        {
          name,
        }: {
          name?: string;
        },
      ) => {
        if (
          name === "dataDeNascimento" &&
          formData.dataDeNascimento?.length === 10
        ) {
          const currentCode = form.getValues("codigoDoSocio");
          
          // Se já tiver um código válido no formato padrão, não sobrescrevemos automaticamente
          if (currentCode && REGISTRATION_CODE_PATTERN.test(String(currentCode))) {
            return;
          }

          const generatedCode = await generateRegistrationNumber(
            formData.dataDeNascimento,
          );
          if (generatedCode) {
            form.setValue("codigoDoSocio", generatedCode, {
              shouldValidate: true,
            });
          }
        }
      },
    );

    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, [form, isEditing]);

  return { handleGenerateCode };
}
