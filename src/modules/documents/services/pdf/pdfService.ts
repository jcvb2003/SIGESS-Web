import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { toast } from "sonner";
import { fillPdfForm } from "./pdfFormFiller";
import { DocumentTemplate } from "../../../settings/types/settings.types";
import {
  FieldFontConfig,
  pdfFontExtractor,
} from "./fontExtraction/fontExtractor";
import {
  resetFontSystem,
  applyGlobalFontConfig,
} from "./fontConfiguration/fontConfig";
const templateCache = new Map<string, ArrayBuffer>();

/**
 * Baixa o modelo de PDF (ou recupera do cache)
 */
async function fetchTemplateBytes(template: DocumentTemplate): Promise<ArrayBuffer> {
  if (templateCache.has(template.id)) {
    console.log(`Usando template cacheado: ${template.name}`);
    return templateCache.get(template.id)!;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(template.fileUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Falha ao baixar o modelo de documento.");

    const pdfBytes = await response.arrayBuffer();
    templateCache.set(template.id, pdfBytes);
    console.log(`Template baixado e cacheado: ${template.name}`);
    return pdfBytes;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("O download do modelo de documento expirou (timeout).");
    }
    throw err;
  }
}

/**
 * Processa as configurações de fonte do template
 */
function parseFontConfigurations(fontConfigurations?: unknown): FieldFontConfig[] {
  if (!fontConfigurations) return [];

  try {
    const parsed = typeof fontConfigurations === "string" 
      ? (JSON.parse(fontConfigurations) as unknown) 
      : fontConfigurations;

    if (Array.isArray(parsed)) return parsed as FieldFontConfig[];
    
    if (parsed && typeof parsed === "object") {
      const configObj = parsed as Record<string, unknown>;
      if (Array.isArray(configObj.fieldConfigurations)) {
        return configObj.fieldConfigurations as FieldFontConfig[];
      }
    }
  } catch (e) {
    console.error("Erro ao fazer parse das configurações de fonte:", e);
  }
  return [];
}

/**
 * Abre o PDF em uma nova aba
 */
function openPdfWindow(blob: Blob, fileName: string): boolean {
  const url = URL.createObjectURL(blob);
  const pdfWindow = window.open(url, "_blank");

  if (!pdfWindow) {
    toast.error("O navegador bloqueou a abertura do PDF. Verifique os pop-ups.");
    return false;
  }

  // Tenta definir o título da aba (alguns browsers podem ignorar)
  setTimeout(() => {
    try {
      if (pdfWindow.document) pdfWindow.document.title = fileName;
    } catch {
      /* ignore cross-origin errors */
    }
  }, 500);

  // Limpa o objeto URL para liberar memória
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

export const pdfService = {
  async generatePdfDocument(
    template: DocumentTemplate,
    data: Record<string, string>,
    fileName: string,
  ): Promise<boolean> {
    try {
      resetFontSystem();

      const [pdfBytes, parsedFieldConfigurations] = await Promise.all([
        fetchTemplateBytes(template),
        Promise.resolve(parseFontConfigurations(template.fontConfigurations)),
      ]);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.registerFontkit(fontkit);

      const form = pdfDoc.getForm();
      const isOtherDocument = template.documentType === "other";
      let fieldConfigurations = parsedFieldConfigurations;

      if (isOtherDocument && fieldConfigurations.length === 0) {
        const extracted = await pdfFontExtractor.extractFieldFontConfigurations(
          pdfBytes,
        );
        fieldConfigurations = extracted.fieldConfigurations;
      }

      const hasFieldConfigurations = fieldConfigurations.length > 0;

      await fillPdfForm(
        form,
        data,
        pdfDoc,
        fieldConfigurations,
      );

      if (!isOtherDocument && hasFieldConfigurations) {
        await applyGlobalFontConfig(pdfDoc, fieldConfigurations);
      }

      const pdfBytesSaved = await pdfDoc.save({
        updateFieldAppearances: !(isOtherDocument && hasFieldConfigurations),
      });
      const blob = new Blob([pdfBytesSaved.buffer as ArrayBuffer], { type: "application/pdf" });

      return openPdfWindow(blob, fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar PDF.");
      return false;
    }
  },
};
