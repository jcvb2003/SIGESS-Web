import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

async function extractText() {
  const data = new Uint8Array(fs.readFileSync(".temp/untitled - lista_pa-1.pdf"));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  console.log(`Páginas: ${pdf.numPages}`);
  for (let i = 1; i <= Math.min(3, pdf.numPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" | ");
    console.log(`\n=== Página ${i} ===\n${text.substring(0, 1000)}...`);
  }
}

extractText().catch(console.error);
