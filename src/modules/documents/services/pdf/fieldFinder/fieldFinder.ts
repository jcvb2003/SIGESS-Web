import { PDFForm } from "pdf-lib";

/**
 * Busca um campo no formulário PDF pelo nome EXATO.
 * Todos os PDFs devem seguir a padronização de nomes de campo.
 * Não é permitido matching parcial ou por substring.
 *
 * O prefixo "undefined." é removido automaticamente pois é um
 * artefato do pdf-lib quando um campo aparece duplicado no
 * formulário (mesmo nome em múltiplos locais). O nome real
 * do campo no PDF não inclui esse prefixo.
 */
export function findField(form: PDFForm, fieldName: string) {
  try {
    return form.getTextField(fieldName);
  } catch {
    const allFields = form.getFields();
    const searchName = fieldName.toLowerCase();

    const matchingField = allFields.find((f) => {
      const rawName = f.getName();
      const normalizedName = rawName.startsWith("undefined.")
        ? rawName.slice("undefined.".length)
        : rawName;
      return normalizedName.toLowerCase() === searchName;
    });
    if (matchingField) {
      try {
        return form.getTextField(matchingField.getName());
      } catch {
        try {
          return form.getCheckBox(matchingField.getName());
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
