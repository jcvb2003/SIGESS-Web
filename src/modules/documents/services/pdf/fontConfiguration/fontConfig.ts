import { PDFDocument, PDFFont, StandardFonts } from "pdf-lib";
import { FieldFontConfig } from "../fontExtraction/fontExtractor";
const fontBytesCache = new Map<string, ArrayBuffer>();
let documentFontCache = new WeakMap<PDFDocument, Map<string, PDFFont>>();
export function clearFontCache() {
  fontBytesCache.clear();
  documentFontCache = new WeakMap<PDFDocument, Map<string, PDFFont>>();
}
export function resetFontSystem() {
  clearFontCache();
}
async function loadFontFile(path: string): Promise<ArrayBuffer> {
  const cachedBytes = fontBytesCache.get(path);
  if (cachedBytes) {
    return cachedBytes.slice(0);
  }
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar fonte: ${path}`);
  }
  const bytes = await response.arrayBuffer();
  fontBytesCache.set(path, bytes);
  return bytes.slice(0);
}
export async function getFont(
  fontName: string,
  pdfDoc: PDFDocument,
): Promise<PDFFont> {
  const normalizedName = fontName.toLowerCase();
  let fontMap = documentFontCache.get(pdfDoc);
  if (!fontMap) {
    fontMap = new Map<string, PDFFont>();
    documentFontCache.set(pdfDoc, fontMap);
  }
  const cachedFont = fontMap.get(normalizedName);
  if (cachedFont) {
    return cachedFont;
  }
  let font: PDFFont;
  try {
    switch (normalizedName) {
      case "calibri":
      case "calibri-regular": {
        const regularBytes = await loadFontFile("/fonts/calibri.ttf");
        font = await pdfDoc.embedFont(regularBytes);
        break;
      }
      case "calibri-bold": {
        const boldBytes = await loadFontFile("/fonts/calibri-bold.ttf");
        font = await pdfDoc.embedFont(boldBytes);
        break;
      }
      case "calibri-italic": {
        const italicBytes = await loadFontFile("/fonts/calibri-italic.ttf");
        font = await pdfDoc.embedFont(italicBytes);
        break;
      }
      case "calibri-bold-italic":
      case "calibri-bolditalic": {
        const boldItalicBytes = await loadFontFile(
          "/fonts/calibri-bold-italic.ttf",
        );
        font = await pdfDoc.embedFont(boldItalicBytes);
        break;
      }
      case "courier":
      case "couriernew":
      case "courier-new":
      case "courier new":
      case "couriernewpsmt": {
        const courierBytes = await loadFontFile("/fonts/courier-new.ttf");
        font = await pdfDoc.embedFont(courierBytes);
        break;
      }
      case "couriernew-bold":
      case "courier-new-bold":
      case "couriernewps-boldmt": {
        const courierBoldBytes = await loadFontFile(
          "/fonts/courier-new-bold.ttf",
        );
        font = await pdfDoc.embedFont(courierBoldBytes);
        break;
      }
      case "couriernew-italic":
      case "courier-new-italic":
      case "couriernewps-italicmt": {
        const courierItalicBytes = await loadFontFile(
          "/fonts/courier-new-italic.ttf",
        );
        font = await pdfDoc.embedFont(courierItalicBytes);
        break;
      }
      case "couriernew-bolditalic":
      case "courier-new-bold-italic":
      case "couriernewps-bolditalicmt": {
        const courierBoldItalicBytes = await loadFontFile(
          "/fonts/courier-new-bold-italic.ttf",
        );
        font = await pdfDoc.embedFont(courierBoldItalicBytes);
        break;
      }
      case "helvetica":
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      case "helvetica-bold":
        font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        break;
      case "times":
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        break;
      default:
        if (normalizedName.includes(".ttf") || normalizedName.includes("/")) {
          const bytes = await loadFontFile(normalizedName);
          font = await pdfDoc.embedFont(bytes);
        } else {
          console.warn(`Fonte desconhecida: ${fontName}, usando Helvetica.`);
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }
    }
  } catch (error) {
    console.warn(
      `Erro ao carregar fonte ${fontName}, usando Helvetica.`,
      error,
    );
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  fontMap.set(normalizedName, font);
  return font;
}
export async function applyGlobalFontConfig(
  pdfDoc: PDFDocument,
  fontConfigurations: FieldFontConfig[],
): Promise<void> {
  if (fontConfigurations.length === 0) {
    return;
  }
  try {
    const form = pdfDoc.getForm();
    for (const config of fontConfigurations) {
      try {
        const field = form.getTextField(config.fieldName);
        if (field && config.fontConfig) {
          if (config.fontConfig.fontSize && config.fontConfig.fontSize > 0) {
            try {
              const fontSize = Math.max(
                6,
                Math.min(72, config.fontConfig.fontSize),
              );
              field.setFontSize(fontSize);
            } catch (error) {
              console.error(
                `Erro ao definir tamanho de fonte para o campo ${config.fieldName}:`,
                error,
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `Erro ao aplicar configuração de fonte para o campo ${config.fieldName}:`,
          error,
        );
      }
    }
    const firstConfig = fontConfigurations[0]?.fontConfig;
    if (firstConfig?.fontName) {
      const font = await getFont(firstConfig.fontName, pdfDoc);
      if (font) {
        form.updateFieldAppearances(font);
        console.log(`Fonte global aplicada: ${firstConfig.fontName}`);
      }
    }
    console.log("Aplicação de configurações de fonte concluída");
  } catch (error) {
    console.error("Erro ao aplicar configurações de fonte globalmente:", error);
  }
}
