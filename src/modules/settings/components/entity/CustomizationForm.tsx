import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { EntityVisualIdentity } from "./EntityVisualIdentity";
import { useEntityData } from "@/shared/hooks/useEntityData";
import { BRANDING_COLORS } from "../../constants/brandingDefaults";
import type { EntitySettings } from "../../types/settings.types";
import { toast } from "sonner";

const customizationSchema = z.object({
  name: z.string().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
  corSidebar: z.string().optional(),
  logoUrl: z.string().optional(),
  logoPath: z.string().optional(),
});

type CustomizationFormData = z.infer<typeof customizationSchema>;

interface CustomizationFormProps {
  readOnly?: boolean;
}

export function CustomizationForm({ readOnly = false }: Readonly<CustomizationFormProps>) {
  const { entity, isLoading, isSaving, saveEntity } = useEntityData();
  const methods = useForm<CustomizationFormData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      name: "",
      corPrimaria: BRANDING_COLORS.primary,
      corSecundaria: BRANDING_COLORS.secondary,
      corSidebar: BRANDING_COLORS.primary,
      logoUrl: "",
      logoPath: "",
    },
  });

  useEffect(() => {
    if (entity) {
      methods.reset({
        name: entity.name || "",
        corPrimaria: entity.corPrimaria || BRANDING_COLORS.primary,
        corSecundaria: entity.corSecundaria || BRANDING_COLORS.secondary,
        corSidebar: entity.corSidebar || BRANDING_COLORS.primary,
        logoUrl: entity.logoUrl || "",
        logoPath: entity.logoPath || "",
      });
    }
  }, [entity]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CustomizationFormData) => {
    // We only update the color fields and name (required), other fields untouched
    if (!entity) return;

    const values: EntitySettings = {
      ...entity,
      corPrimaria: data.corPrimaria ?? BRANDING_COLORS.primary,
      corSecundaria: data.corSecundaria ?? BRANDING_COLORS.secondary,
      corSidebar: data.corSidebar ?? BRANDING_COLORS.primary,
      logoUrl: data.logoUrl || undefined,
      logoPath: data.logoPath || undefined,
    };
    await saveEntity(values);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit, () => {
          toast.error("Não foi possível salvar a personalização.");
        })}
        className="space-y-4"
      >
        <fieldset disabled={readOnly || isLoading || isSaving} className={readOnly ? "opacity-50 grayscale pointer-events-none" : ""}>
        <div className="flex justify-end gap-2">
          {methods.formState.isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || isSaving}
              onClick={() => methods.reset()}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={readOnly || isLoading || isSaving || !methods.formState.isDirty} size="sm">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar preferências
              </>
            )}
          </Button>
        </div>
        <div className="grid gap-4">
          <EntityVisualIdentity />
        </div>
        </fieldset>
      </form>
    </FormProvider>
  );
}
