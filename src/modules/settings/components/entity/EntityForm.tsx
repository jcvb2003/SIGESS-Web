import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { EntityBasicInfo } from "./EntityBasicInfo";
import { EntityAddress } from "./EntityAddress";
import { EntityContact } from "./EntityContact";
import { EntityInstitutional } from "./EntityInstitutional";
import { useEntityData } from "@/shared/hooks/useEntityData";
import type { EntitySettings } from "../../types/settings.types";
import { entitySchema, EntityFormData } from "../../hooks/useEntityValidation";
export function EntityForm() {
  const { entity, isLoading, isSaving, saveEntity } = useEntityData();
  const methods = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      name: "",
      shortName: "",
      cnpj: "",
      street: "",
      number: "",
      district: "",
      city: "",
      state: "",
      cep: "",
      phone1: "",
      phone2: "",
      email: "",
      federation: "",
      confederation: "",
      pole: "",
      foundation: "",
      county: "",
    },
  });
  useEffect(() => {
    if (entity) {
      methods.reset({
        name: entity.name || "",
        shortName: entity.shortName || "",
        cnpj: entity.cnpj || "",
        street: entity.street || "",
        number: entity.number || "",
        district: entity.district || "",
        city: entity.city || "",
        state: entity.state || "",
        cep: entity.cep || "",
        phone1: entity.phone1 || "",
        phone2: entity.phone2 || "",
        email: entity.email || "",
        federation: entity.federation || "",
        confederation: entity.confederation || "",
        pole: entity.pole || "",
        foundation: entity.foundation || "",
        county: entity.county || "",
      });
    }
  }, [entity, methods]);
  const onSubmit = async (data: EntityFormData) => {
    const values: EntitySettings = {
      id: entity?.id,
      name: data.name,
      shortName: data.shortName ?? "",
      cnpj: data.cnpj ?? "",
      street: data.street ?? "",
      number: data.number ?? "",
      district: data.district ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      cep: data.cep ?? "",
      phone1: data.phone1 ?? "",
      phone2: data.phone2 ?? "",
      email: data.email ?? "",
      federation: data.federation ?? "",
      confederation: data.confederation ?? "",
      pole: data.pole ?? "",
      foundation: data.foundation ?? "",
      county: data.county ?? "",
    };
    await saveEntity(values);
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || isSaving} size="sm">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar dados da entidade
              </>
            )}
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <EntityBasicInfo />
            <EntityAddress />
          </div>
          <div className="space-y-4">
            <EntityContact />
            <EntityInstitutional />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
