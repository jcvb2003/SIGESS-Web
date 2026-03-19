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
import {
  getPdfFieldMappingsRequerimento,
  getPdfFieldMappingsResidencia,
  getPdfFieldMappingsTermoRepresentacao,
} from "./pdfFieldMappings";
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
export async function fillPdfForm(
  form: PDFForm,
  data: Record<string, string>,
  fileName: string,
  pdfDoc?: PDFDocument,
  fieldConfigurations?: FieldFontConfig[],
): Promise<number> {
  let mapping: Record<string, string[]> = {};
  if (fileName.toLowerCase().includes("requerimento_defeso")) {
    mapping = getPdfFieldMappingsRequerimento();
  } else if (fileName.toLowerCase().includes("declaracao_residencia")) {
    mapping = getPdfFieldMappingsResidencia();
  } else if (fileName.toLowerCase().includes("termo_representacao")) {
    mapping = getPdfFieldMappingsTermoRepresentacao();
  }
  let filledCount = 0;
  const hasMapping = Object.keys(mapping).length > 0;
  if (hasMapping) {
    for (const [dataKey, possibleFieldNames] of Object.entries(mapping)) {
      const value = data[dataKey];
      if (!value) continue;
      for (const pdfFieldName of possibleFieldNames) {
        const field = findField(form, pdfFieldName);
        if (field) {
          try {
            if (field instanceof PDFTextField) {
              field.setText(value);
              if (pdfDoc && fieldConfigurations) {
                await applyFieldConfig(field, pdfDoc, fieldConfigurations);
              }
            } else if (field instanceof PDFCheckBox) {
              if (
                value === "true" ||
                value === "1" ||
                value.toLowerCase() === "sim"
              ) {
                field.check();
              } else {
                field.uncheck();
              }
            }
            filledCount++;
            break;
          } catch (e) {
            console.warn(`Erro ao preencher campo mapeado ${pdfFieldName}`, e);
          }
        }
      }
    }
  } else {
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;
      const field = findField(form, key);
      if (field) {
        try {
          if (field instanceof PDFTextField) {
            field.setText(value);
            if (pdfDoc && fieldConfigurations) {
              await applyFieldConfig(field, pdfDoc, fieldConfigurations);
            }
          } else if (field instanceof PDFCheckBox) {
            if (
              value === "true" ||
              value === "1" ||
              value.toLowerCase() === "sim"
            ) {
              field.check();
            } else {
              field.uncheck();
            }
          }
          filledCount++;
        } catch (e) {
          console.warn(`Erro ao preencher campo genérico ${key}`, e);
        }
      }
    }
  }
  return filledCount;
}
