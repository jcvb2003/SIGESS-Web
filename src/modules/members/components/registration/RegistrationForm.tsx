import { useState, useEffect } from "react";
import { useForm, DefaultValues } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/shared/components/ui/form";
import { memberQueryKeys } from "../../queryKeys";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  MemberRegistrationForm,
  initialMemberRegistrationForm,
} from "../../types/member.types";
import { DuplicateCpfError, LimitExceededError, memberService } from "../../services/memberService";
import {
  memberRegistrationSchema,
  MemberRegistrationSchemaType,
} from "../../schemas/memberRegistration.schema";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { RegistrationTabs } from "./RegistrationTabs";
import { RegistrationActions } from "./RegistrationActions";
import { useNavigate } from "react-router-dom";
import { useCpfValidation } from "../../hooks/registration/useCpfValidation";
import { photoService } from "../../services/photoService";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";
import { useEntityData } from "@/modules/settings/hooks/useEntityData";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
interface RegistrationFormProps {
  readonly onSuccess?: () => void;
  readonly initialData?: MemberRegistrationForm;
  readonly memberId?: string;
}
export function RegistrationForm({
  onSuccess,
  initialData,
  memberId,
}: Readonly<RegistrationFormProps>) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const { metadata } = useUserMetadata();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEditMode = !!memberId;
  const form = useForm<MemberRegistrationSchemaType, undefined, MemberRegistrationSchemaType>({
    resolver: zodResolver(memberRegistrationSchema) as import("react-hook-form").Resolver<MemberRegistrationSchemaType>,
    defaultValues: (initialData || initialMemberRegistrationForm) as DefaultValues<MemberRegistrationSchemaType>,
    mode: "onChange",
  });

  useCpfValidation(form, isEditMode);

  const { entity } = useEntityData();

  useEffect(() => {
    // Somente preenche automaticamente em modo de criação (!isEditMode)
    // e se os campos do formulário estiverem vazios
    if (!isEditMode && entity) {
      if (!form.getValues("cidade") && entity.city) {
        form.setValue("cidade", entity.city);
      }
      if (!form.getValues("cep") && entity.cep) {
        form.setValue("cep", entity.cep);
      }
      if (!form.getValues("uf") && entity.state) {
        form.setValue("uf", entity.state);
      }
    }
  }, [isEditMode, entity, form]);

  useEffect(() => {
    async function fetchCount() {
      if (!isEditMode) {
        try {
          const { count } = await memberService.countMembers();
          setMemberCount(count);
        } catch (error) {
          console.error("Error fetching member count:", error);
        }
      }
    }
    fetchCount();
  }, [isEditMode]);

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);
  const { isSubmitting } = form.formState;
  const handlePhotoActions = async (data: MemberRegistrationSchemaType) => {
    if (data.photoDelete) {
      const cpfToDelete = initialData?.cpf || data.cpf;
      if (cpfToDelete) {
        await photoService.deletePhoto(cpfToDelete);
      }
    } else if (data.photoFile instanceof File) {
      await photoService.uploadPhoto(data.photoFile, data.cpf);
    }
  };

  const handleRegistrationError = (err: unknown) => {
    const errorCode =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: string }).code ?? "")
        : "";

    if (err instanceof DuplicateCpfError || errorCode === "DUPLICATE_CPF") {
      toast.error("Já existe um cadastro com este CPF.");
      form.setError("cpf", { type: "manual", message: "CPF já cadastrado" });
    } else if (err instanceof LimitExceededError || errorCode === "LIMIT_EXCEEDED") {
      toast.error("Limite de cadastros atingido.");
    } else {
      toast.error("Não foi possível salvar o cadastro. Tente novamente.");
      console.error(err);
    }
  };

  const onSubmit = async (data: MemberRegistrationSchemaType) => {
    try {
      const payload = data as MemberRegistrationForm;
      
      if (isEditMode && memberId) {
        await memberService.updateMember(memberId, payload);
        await handlePhotoActions(data);
        toast.success("Sócio atualizado com sucesso.");
      } else {
        await memberService.create(payload);
        if (data.photoFile instanceof File) {
          await photoService.uploadPhoto(data.photoFile, data.cpf);
        }
        toast.success("Sócio cadastrado com sucesso.");
      }
      
      form.reset(initialMemberRegistrationForm);
      
      // Invalidate members query to ensure the list is updated
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all });
      
      onSuccess?.();
      navigate("/members");
    } catch (err: unknown) {
      handleRegistrationError(err);
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleConfirmSubmit = () => {
    form.handleSubmit((data) => onSubmit(data))();
  };

  const isLimitReached = !isEditMode && 
                         metadata?.max_socios !== undefined && 
                         metadata?.max_socios !== null &&
                         memberCount !== null && 
                         memberCount >= metadata.max_socios;

  return (
    <div className="space-y-6">
      {isLimitReached && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limite Atingido</AlertTitle>
          <AlertDescription>
            Você atingiu o limite de {metadata?.max_socios} sócios para este período. 
            Entre em contato com o suporte para aumentar seu limite.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={(e) => {
            if (isLimitReached) {
              e.preventDefault();
              return;
            }
            form.handleSubmit(() => setConfirmOpen(true))(e);
          }}
          className="space-y-8"
        >
          <ErrorBoundary>
            <RegistrationTabs isEditMode={isEditMode} />
          </ErrorBoundary>

          <RegistrationActions
            isSubmitting={isSubmitting}
            onCancel={() => navigate("/members")}
            isEditMode={isEditMode}
            disabled={isLimitReached}
          />
        </form>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isEditMode ? "Confirmar alterações?" : "Confirmar cadastro?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isEditMode
                  ? "Deseja realmente salvar as alterações realizadas no cadastro deste sócio?"
                  : "Deseja realmente salvar o cadastro deste novo sócio? Verifique se todos os dados estão corretos."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Form>
    </div>
  );
}
