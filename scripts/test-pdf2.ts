import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

async function extractText() {
  const data = new Uint8Array(fs.readFileSync(".temp/untitled - lista_pa-1.pdf"));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  const rows = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = content.items
      .map((i) => ("str" in i ? i.str.trim() : ""))
      .filter(Boolean);

    let lastRecordEnd = 0;

    for (let i = 0; i < lines.length; i++) {
      const cpfMatch = lines[i].match(/^[Xx\d]{3}\.\d{3}\.\d{3}-[Xx\d]{2}$/);
      if (cpfMatch) {
        // Encontrou CPF
        const nameParts = [];
        for (let j = lastRecordEnd; j < i; j++) {
          const str = lines[j];
          if (/^[X\s]+$/i.test(str) || ["NOME", "CPF", "MUNICÍPIO", "UF", "ENVIOS", "PENDENTES", "Página"].includes(str) || (/^\d+$/.test(str) && j < 5)) continue; 
          nameParts.push(str);
        }
        const nome = nameParts.join(" ").trim();

        let anos = [];
        let cur = i + 3; // Depois do CPF vem Município e UF, ex: IGARAPE-MIRI, PA
        while (cur < lines.length) {
          const s = lines[cur];
          const anoMatch = s.match(/(202[1-4])/);
          if (anoMatch) {
            anos.push(parseInt(anoMatch[0], 10));
            cur++;
          } else {
            // Se encontrar uma virgula solta ou algo assim, continua. Nomes não são números
            if (s === "," || s === "") {
               cur++;
               continue;
            }
            break;
          }
        }
        lastRecordEnd = cur;

        if (anos.length > 0) {
          rows.push({ nome, cpfMascarado: cpfMatch[0], anosPendentes: anos });
        }
      }
    }
  }

  console.log(rows);
  console.log(`Total encontrados: ${rows.length}`);
}

extractText().catch(console.error);
