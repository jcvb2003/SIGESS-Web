import { PDFDocument, PDFTextField, TextAlignment } from "pdf-lib";
import * as fs from "node:fs";
import * as path from "node:path";

const docsDir = String.raw`C:\Users\José Carlos\Downloads\DOCS`;
const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".pdf"));

function getAlignmentName(alignment: TextAlignment | undefined): string {
  if (alignment === TextAlignment.Left) return "Left";
  if (alignment === TextAlignment.Center) return "Center";
  if (alignment === TextAlignment.Right) return "Right";
  return "Unknown/Default (Left)";
}

for (const file of files) {
  try {
    const data = fs.readFileSync(path.join(docsDir, file));
    const pdfDoc = await PDFDocument.load(data);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`Fields in ${file}:`);
    for (const field of fields) {
      let alignmentInfo = "";
      if (field instanceof PDFTextField) {
        try {
          const alignment = field.getAlignment();
          alignmentInfo = ` [Alignment: ${getAlignmentName(alignment)}]`;
        } catch {
          alignmentInfo = " [Alignment: Could not read]";
        }
      }
      console.log(`- ${field.getName()}${alignmentInfo}`);
    }
    console.log("---");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`Error reading ${file}: ${message}`);
  }
}
