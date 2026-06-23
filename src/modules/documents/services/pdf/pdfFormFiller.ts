import {
  PDFButton,
  PDFCheckBox,
  PDFForm,
  PDFTextField,
  PDFDocument,
  TextAlignment,
  ImageAlignment,
} from "pdf-lib";
import { findField } from "./fieldFinder/fieldFinder";
import { FieldFontConfig } from "./fontExtraction/fontExtractor";
import { getFont } from "./fontConfiguration/fontConfig";
import { getPdfFieldMappings } from "./pdfFieldMappings";
// Regex para o operador Tf no stream DA: "/FontName SIZE Tf"
const TF_REGEX = /\/(\S+)\s+([\d.]+)\s+Tf/;

async function applyFieldConfig(
  field: PDFTextField,
  pdfDoc: PDFDocument,
  fieldConfigurations: FieldFontConfig[],
) {
  const fieldName = field.getName();
  const config = fieldConfigurations.find((c) => c.fieldName === fieldName);
  if (!config) return;

  try {
    const font = await getFont(config.fontConfig.fontName, pdfDoc);

    switch (config.fontConfig.alignment) {
      case "center": field.setAlignment(TextAlignment.Center); break;
      case "right":  field.setAlignment(TextAlignment.Right);  break;
      default:       field.setAlignment(TextAlignment.Left);
    }

    if (config.fontConfig.fontSize === 0) {
      // Campo auto-size (0 Tf no DA original).
      // defaultTextFieldAppearanceProvider lê `widgetFontSize ?? fieldFontSize`.
      // O widget pode ter um tamanho fixo herdado do editor de PDF — se for não-zero,
      // ele sobrescreve o field-level 0 e bloqueia o computeFontSize.
      // Solução: patchar o DA de cada widget para 0 Tf antes de updateAppearances,
      // forçando o caminho fontSize===0 → computeFontSize → texto se ajusta ao campo.
      const acroField = (field as unknown as { acroField: { getWidgets(): { getDefaultAppearance(): string | undefined; setDefaultAppearance(da: string): void }[] } }).acroField;
      if (acroField?.getWidgets) {
        for (const widget of acroField.getWidgets()) {
          const da = widget.getDefaultAppearance?.() ?? "";
          if (da) {
            widget.setDefaultAppearance?.(da.replace(TF_REGEX, "/$1 0 Tf"));
          }
        }
      }
      // Patchar também o field-level DA para o caso de widget sem DA próprio.
      field.setFontSize(0);
    } else {
      field.setFontSize(config.fontConfig.fontSize);
    }

    field.updateAppearances(font);
  } catch (error) {
    console.warn(`Erro ao aplicar configuração de fonte para o campo ${fieldName}:`, error);
  }
}
async function embedImageInButton(
  button: PDFButton,
  imageUrl: string,
  pdfDoc: PDFDocument,
): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.status}`);
  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "";
  const image = contentType.includes("png")
    ? await pdfDoc.embedPng(bytes)
    : await pdfDoc.embedJpg(bytes);
  button.setImage(image, ImageAlignment.Center);
}

async function processPdfField(
  field: PDFTextField | PDFCheckBox | PDFButton,
  value: string,
  pdfDoc?: PDFDocument,
  fieldConfigurations?: FieldFontConfig[],
): Promise<boolean> {
  try {
    if (field instanceof PDFButton) {
      if (pdfDoc && value) {
        await embedImageInButton(field, value, pdfDoc);
      }
    } else if (field instanceof PDFTextField) {
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
