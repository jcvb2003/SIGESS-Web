import {
  PDFCheckBox,
  PDFForm,
  PDFTextField,
  PDFDocument,
  TextAlignment,
} from "pdf-lib";
import { findField } from "./fieldFinder/fieldFinder";
import { FieldFontConfig } from "./fontExtraction/fontExtractor";
import { getFont } from "./fontConfiguration/fontConfig";
import { getPdfFieldMappings } from "./pdfFieldMappings";
async function applyFieldConfig(
  field: PDFTextField,
  pdfDoc: PDFDocument,
  fieldConfigurations: FieldFontConfig[],
) {
  const fieldName = field.getName();
  const config = fieldConfigurations.find((c) => c.fieldName === fieldName);
  if (config) {
    try {
      const font = await getFont(config.fontConfig.fontName, pdfDoc);
      field.updateAppearances(font);
      field.setFontSize(config.fontConfig.fontSize);
      switch (config.fontConfig.alignment) {
        case "center":
          field.setAlignment(TextAlignment.Center);
          break;
        case "right":
          field.setAlignment(TextAlignment.Right);
          break;
        case "left":
        default:
          field.setAlignment(TextAlignment.Left);
          break;
      }
    } catch (error) {
      console.warn(
        `Erro ao aplicar configuração de fonte para o campo ${fieldName}:`,
        error,
      );
    }
  }
}
async function processPdfField(
  field: PDFTextField | PDFCheckBox,
  value: string,
  pdfDoc?: PDFDocument,
  fieldConfigurations?: FieldFontConfig[],
): Promise<boolean> {
  try {
    if (field instanceof PDFTextField) {
      field.setText(value);
      if (pdfDoc && fieldConfigurations) {
        await applyFieldConfig(field, pdfDoc, fieldConfigurations);
      }
    } else if (field instanceof PDFCheckBox) {
      if (value === "true" || value === "1" || value.toLowerCase() === "sim") {
        field.check();
      } else {
        field.uncheck();
      }
    }
    return true;
  } catch (e) {
    console.warn(`Erro ao preencher campo ${field.getName()}`, e);
    return false;
  }
}

export async function fillPdfForm(
  form: PDFForm,
  data: Record<string, string>,
  pdfDoc?: PDFDocument,
  fieldConfigurations?: FieldFontConfig[],
): Promise<number> {
  const mapping = getPdfFieldMappings();
  let filledCount = 0;

  for (const [dataKey, fieldNames] of Object.entries(mapping)) {
    const value = data[dataKey];
    if (!value) continue;

    const pdfFieldName = fieldNames[0];
    const field = findField(form, pdfFieldName);
    if (!field) continue;

    const success = await processPdfField(
      field,
      value,
      pdfDoc,
      fieldConfigurations,
    );
    if (success) {
      filledCount++;
    }
  }

  return filledCount;
}
