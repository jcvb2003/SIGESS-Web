import { PDFForm } from "pdf-lib";
export function findField(form: PDFForm, fieldName: string) {
  try {
    return form.getTextField(fieldName);
  } catch {
    const allFields = form.getFields();
    const matchingField = allFields.find((f) => {
      const currentName = f.getName().toLowerCase();
      const searchName = fieldName.toLowerCase();
      return (
        currentName === searchName ||
        currentName.includes(searchName) ||
        searchName.includes(currentName)
      );
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
