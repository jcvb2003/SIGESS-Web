import { useQuery } from "@tanstack/react-query";
import { settingsService } from "../../settings/services/settingsService";
export const usePdfTemplates = () => {
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["settings", "document-templates"],
    queryFn: async () => {
      const { data, error } = await settingsService.getDocumentTemplates();
      if (error) throw error;
      return data || [];
    },
  });
  const getTemplatesByType = (type: string) => {
    return templates.filter((template) => template.documentType === type);
  };
  const residenceTemplates = getTemplatesByType("residence_declaration");
  const representationTemplates = getTemplatesByType("representation_term");
  const defesoTemplates = getTemplatesByType("inss_application");
  return {
    templates,
    isLoading,
    error,
    residenceTemplates,
    representationTemplates,
    defesoTemplates,
  };
};
