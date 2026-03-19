import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/shared/lib/supabase/client";
import { MemberRegistrationSchemaType } from "../../schemas/memberRegistration.schema";
export function useCpfValidation(
  form: UseFormReturn<MemberRegistrationSchemaType>,
  isEditMode: boolean,
) {
  const [isValidatingCpf, setIsValidatingCpf] = useState(false);
  const cpf = form.watch("cpf");
  useEffect(() => {
    if (isEditMode) return;
    const cleanCpf = cpf?.replaceAll(/\D/g, "") || "";

    if (cleanCpf.length !== 11) {
      if (form.getFieldState("cpf").error?.type === "manual") {
        form.clearErrors("cpf");
      }
      return;
    }

    const timer = setTimeout(() => {
      const checkCpf = async () => {
        setIsValidatingCpf(true);
        try {
          const { data, error } = await supabase
            .from("socios")
            .select("id")
            .eq("cpf", cpf)
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
    }, 500);

    return () => clearTimeout(timer);
  }, [cpf, form, isEditMode]);
  return { isValidatingCpf };
}
