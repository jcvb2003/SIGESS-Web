import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";
import { memberService } from "../../services/memberService";
export function useMemberCodeGenerator(
  form: UseFormReturn<MemberRegistrationSchemaType>,
  isEditing: boolean,
) {
  const generateRegistrationNumber = async (
    birthdate: string,
  ): Promise<string> => {
    if (!birthdate || birthdate.length !== 10) return "";
    try {
      const month = birthdate.substring(5, 7);
      const prefix = `${month}0`;
      const latestNumberStr =
        await memberService.getLastRegistrationNumber(prefix);
      let sequenceNumber = 1;
      if (latestNumberStr && latestNumberStr.startsWith(prefix)) {
        const sequencePart = latestNumberStr.substring(3);
        sequenceNumber = parseInt(sequencePart || "0", 10) + 1;
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
  useEffect(() => {
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
}
