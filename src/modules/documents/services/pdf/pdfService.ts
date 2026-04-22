import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { toast } from "sonner";
import { fillPdfForm } from "./pdfFormFiller";
import { DocumentTemplate } from "../../../settings/types/settings.types";
import { FieldFontConfig } from "./fontExtraction/fontExtractor";
import {
  resetFontSystem,
  applyGlobalFontConfig,
} from "./fontConfiguration/fontConfig";
export const pdfService = {
  async generatePdfDocument(
    template: DocumentTemplate,
    data: Record<string, string>,
    fileName: string,
  ): Promise<boolean> {
    try {
      resetFontSystem();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      let response: Response;
      try {
        response = await fetch(template.fileUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error("O download do modelo de documento expirou (timeout).");
        }
        throw err;
      }

      if (!response.ok) {
        throw new Error("Falha ao baixar o modelo de documento.");
      }
      const pdfBytes = await response.arrayBuffer();
      let fieldConfigurations: FieldFontConfig[] = [];
      if (template.fontConfigurations) {
        try {
          const parsed =
            typeof template.fontConfigurations === "string"
              ? JSON.parse(template.fontConfigurations)
              : template.fontConfigurations;
          if (Array.isArray(parsed)) {
            fieldConfigurations = parsed;
          } else if (
            parsed.fieldConfigurations &&
            Array.isArray(parsed.fieldConfigurations)
          ) {
            fieldConfigurations = parsed.fieldConfigurations;
          }
          console.log(
            `Carregadas configurações para ${fieldConfigurations.length} campos a partir do banco de dados`,
          );
        } catch (e) {
          console.error("Erro ao fazer parse das configurações de fonte:", e);
        }
      } else {
        console.warn(
          "Nenhuma configuração de fonte pre-cadastrada encontrada no template.",
        );
      }
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.registerFontkit(fontkit);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const fieldNames = fields.map((f) => f.getName());
      console.log("Campos disponíveis no PDF:", fieldNames);
      const filledCount = await fillPdfForm(form, data);
      if (filledCount === 0) {
        console.warn(
          "Nenhum campo do formulário foi preenchido automaticamente.",
        );
      }
      if (fieldConfigurations.length > 0) {
        await applyGlobalFontConfig(pdfDoc, fieldConfigurations);
      }
      const pdfBytesSaved = await pdfDoc.save({ updateFieldAppearances: true });
      const blobBytes = new Uint8Array(pdfBytesSaved.byteLength);
      blobBytes.set(pdfBytesSaved);
      const blob = new Blob([blobBytes.buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, "_blank");
      if (!pdfWindow) {
        toast.error(
          "O navegador bloqueou a abertura do PDF. Verifique suas configurações de pop-up.",
        );
        return false;
      }
      setTimeout(() => {
        try {
          if (pdfWindow.document) {
            pdfWindow.document.title = fileName;
          }
        } catch (error) {
          console.error("Erro ao definir título da janela do PDF:", error);
        }
      }, 500);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Verifique se o modelo é válido.");
      return false;
    }
  },
};
