import { Card, CardContent } from "@/shared/components/ui/card";
import { ParametersFormHeader } from "./ParametersFormHeader";
import { FishingPeriodsSection } from "./FishingPeriodsSection";
import { PublicationSection } from "./PublicationSection";
import { useParametersData } from "../../hooks/useParametersData";
import { SystemParameters } from "../../types/settings.types";
import { z } from "zod";
import { optionalDateSchema, flexibleDateSchema } from "@/shared/utils/validators/dateValidators";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

// Esquema de Validação para os Parâmetros
const parametersSchema = z.object({
  defeso1Start: flexibleDateSchema,
  defeso1End: flexibleDateSchema,
  defeso2Start: flexibleDateSchema,
  defeso2End: flexibleDateSchema,
  defesoSpecies: z.string().optional(),
  publicationNumber: z.string().optional(),
  publicationDate: optionalDateSchema,
  publicationLocal: z.string().optional(),
  fishingArea: z.string().optional(),
}).refine(data => {
  if (data.defeso1Start && data.defeso1End) {
    return new Date(data.defeso1Start) < new Date(data.defeso1End);
  }
  return true;
}, {
  message: "Fim do 1º período deve ser após o início",
}).refine(data => {
  if (data.defeso2Start && data.defeso2End) {
    return new Date(data.defeso2Start) < new Date(data.defeso2End);
  }
  return true;
}, {
  message: "Fim do 2º período deve ser após o início",
});

type ParametersFormData = z.infer<typeof parametersSchema>;

export function ParametersForm() {
  const { parameters, isLoading, isSaving, saveParameters } =
    useParametersData();

  const methods = useForm<ParametersFormData>({
    resolver: zodResolver(parametersSchema),
    defaultValues: {
      defeso1Start: "",
      defeso1End: "",
      defeso2Start: "",
      defeso2End: "",
      defesoSpecies: "",
      publicationNumber: "",
      publicationDate: "",
      publicationLocal: "",
      fishingArea: "",
    }
  });

  useEffect(() => {
    if (parameters) {
      methods.reset({
        defeso1Start: parameters.defeso1Start || "",
        defeso1End: parameters.defeso1End || "",
        defeso2Start: parameters.defeso2Start || "",
        defeso2End: parameters.defeso2End || "",
        defesoSpecies: parameters.defesoSpecies || "",
        publicationNumber: parameters.publicationNumber || "",
        publicationDate: parameters.publicationDate || "",
        publicationLocal: parameters.publicationLocal || "",
        fishingArea: parameters.fishingArea || "",
      });
    }
  }, [parameters, methods]);

  const onSubmit = async (data: ParametersFormData) => {
    if (!parameters) return;
    
    const values: SystemParameters = {
      ...parameters,
      defeso1Start: data.defeso1Start || null,
      defeso1End: data.defeso1End || null,
      defeso2Start: data.defeso2Start || null,
      defeso2End: data.defeso2End || null,
      defesoSpecies: data.defesoSpecies || "",
      publicationNumber: data.publicationNumber || "",
      publicationDate: data.publicationDate || null,
      publicationLocal: data.publicationLocal || "",
      fishingArea: data.fishingArea || "",
    };

    await saveParameters(values);
  };

  if (isLoading || !parameters) {
    return <div>Carregando parâmetros...</div>;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Card className="border-border/50 shadow-sm">
          <ParametersFormHeader
            isSaving={isSaving}
            isDisabled={isLoading || isSaving}
          />
          <CardContent className="space-y-4 border-t border-border/10">
            <div className="grid gap-4 lg:grid-cols-2">
              <FishingPeriodsSection />
              <PublicationSection />
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
