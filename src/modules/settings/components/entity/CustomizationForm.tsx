import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { EntityVisualIdentity } from "./EntityVisualIdentity";
import { useEntityData } from "@/shared/hooks/useEntityData";
import type { EntitySettings } from "../../types/settings.types";
import { entitySchema, EntityFormData } from "../../hooks/useEntityValidation";

export function CustomizationForm() {
  const { entity, isLoading, isSaving, saveEntity } = useEntityData();
  const methods = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      name: "",
      corPrimaria: "160 84% 39%",
      corSecundaria: "152 69% 41%",
      corSidebar: "160 84% 39%",
    },
  });

  useEffect(() => {
    if (entity) {
      methods.reset({
        name: entity.name || "",
        corPrimaria: entity.corPrimaria || "160 84% 39%",
        corSecundaria: entity.corSecundaria || "152 69% 41%",
        corSidebar: entity.corSidebar || "160 84% 39%",
      });
    }
  }, [entity, methods]);

  const onSubmit = async (data: EntityFormData) => {
    // We only update the color fields and name (required), other fields untouched
    if (!entity) return;

    const values: EntitySettings = {
      ...entity,
      corPrimaria: data.corPrimaria ?? "160 84% 39%",
      corSecundaria: data.corSecundaria ?? "152 69% 41%",
      corSidebar: data.corSidebar ?? "160 84% 39%",
    };
    await saveEntity(values);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
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
          <Button type="submit" disabled={isLoading || isSaving || !methods.formState.isDirty} size="sm">
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
      </form>
    </FormProvider>
  );
}
