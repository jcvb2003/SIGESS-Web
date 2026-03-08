import { useState } from "react";
import { pdfService } from "../services/pdf/pdfService";
import { processDocumentData } from "../services/pdf/pdfDataProcessor";
import { toast } from "sonner";
import { EntitySettings } from "@/shared/types/entity.types";
import { MemberDatabase } from "../types/document.types";
import {
  SystemParameters,
  DocumentTemplate,
} from "@/modules/settings/types/settings.types";
export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatePdf = async (
    model: DocumentTemplate,
    member: MemberDatabase,
    entity: EntitySettings | null | undefined,
    requestData?: {
      nome?: string | null;
      cpf?: string | null;
      data?: string | null;
    },
    parameters?: SystemParameters | null,
  ) => {
    try {
      setIsGenerating(true);
      const requestOverrides: Record<string, string> = {};
      if (requestData) {
        if (requestData.nome) requestOverrides["nome"] = requestData.nome;
        if (requestData.cpf) requestOverrides["cpf"] = requestData.cpf;
        if (requestData.data) {
          try {
            const datePart = requestData.data.split("T")[0];
            const [year, month, day] = datePart.split("-");
            if (year && month && day) {
              requestOverrides["data"] = `${day}/${month}/${year}`;
            }
          } catch (e) {
            console.error("Error formatting saved request date", e);
          }
        }
      }
      const parametersData = parameters
        ? (parameters as unknown as Record<string, string>)
        : {};
      const dataMap = processDocumentData(
        member,
        entity ?? null,
        { ...requestOverrides, ...parametersData },
        requestData?.data || undefined,
      );
      const success = await pdfService.generatePdfDocument(
        model,
        dataMap,
        `requerimento_defeso_${member.cpf}.pdf`,
      );
      if (success) {
        toast.success("PDF gerado com sucesso!");
      } else {
        toast.error("Erro ao gerar PDF.");
      }
      return success;
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };
  return {
    generatePdf,
    isGenerating,
  };
}
