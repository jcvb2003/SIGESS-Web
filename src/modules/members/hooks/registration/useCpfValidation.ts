import { useState, useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { supabase } from "@/shared/lib/supabase/client";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";
export function useCpfValidation(
  form: UseFormReturn<MemberRegistrationSchemaType>,
  isEditMode: boolean,
) {
  const [isValidatingCpf, setIsValidatingCpf] = useState(false);
  const cpf = useWatch({
    control: form.control,
    name: "cpf",
  });
  const debouncedCpf = useDebounce(cpf, 500);

  useEffect(() => {
    if (isEditMode) return;
    const cleanCpf = debouncedCpf?.replaceAll(/\D/g, "") || "";

    if (cleanCpf.length !== 11) {
      if (form.getFieldState("cpf").error?.type === "manual") {
        form.clearErrors("cpf");
      }
      return;
    }

    const checkCpf = async () => {
      setIsValidatingCpf(true);
      try {
        const { data, error } = await supabase
          .from("socios")
          .select("id")
          .eq("cpf", debouncedCpf)
          .limit(1);

        if (error) {
          console.error("Error checking CPF duplicate:", error);
          return;
        }

        if (data && data.length > 0) {
          form.setError("cpf", {
            type: "manual",
            message: "Este CPF já está cadastrado no sistema.",
          });
        } else if (form.getFieldState("cpf").error?.type === "manual") {
          form.clearErrors("cpf");
        }
      } catch (err) {
        console.error("Failed to validate CPF:", err);
      } finally {
        setIsValidatingCpf(false);
      }
    };
    checkCpf();
  }, [debouncedCpf, form, isEditMode]);
  return { isValidatingCpf };
}
