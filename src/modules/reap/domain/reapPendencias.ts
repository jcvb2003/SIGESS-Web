// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface ReapMember {
  cpf: string;
  nome: string | null;
}

export interface PdfRow {
  id: string;
  nome: string;
  cpfMascarado: string;
  anosPendentes: number[];
}

export interface ReconciliationResult {
  id: string;
  pdfNome: string;
  pdfCpf: string;
  anosPendentes: number[];
  cpfMatch: string | null;
  nomeMatch: string | null;
  matchType: "FULL" | "PARCIAL" | "NONE";
  selected: boolean;
}

// ── Algoritmo de matching de nome ─────────────────────────────────────────────

export function nomeMatchFn(nomeCompleto: string, nomeMascarado: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replaceAll(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replaceAll(/X/gi, "")
      .replaceAll(/[^A-Z\s]/g, "")
      .trim();
  const n1 = norm(nomeCompleto);
  const n2 = norm(nomeMascarado);
  if (n2.length === 0) return false;
  return n1.includes(n2) || n2.includes(n1);
}

// ── Parsers de PDF do governo MPA ─────────────────────────────────────────────

export function extractNome(lines: string[], startIndex: number, endIndex: number): string {
  const nameParts = [];
  for (let j = startIndex; j < endIndex; j++) {
    const str = lines[j];
    if (
      /^[X\s]+$/i.test(str) ||
      ["NOME", "CPF", "MUNICÍPIO", "UF", "ENVIOS", "PENDENTES", "Página"].includes(str) ||
      (/^\d+$/.test(str) && j < 5)
    ) continue;
    nameParts.push(str);
  }
  return nameParts.join(" ").trim();
}

// Anos 2021-2024 — programa REAP Simplificado. Atualizar regex se o programa for prorrogado.
export function extractAnos(lines: string[], startIndex: number): { anos: number[]; nextIndex: number } {
  const anos: number[] = [];
  let cur = startIndex;
  while (cur < lines.length) {
    const s = lines[cur];
    const anoMatch = /(202[1-4])/.exec(s);
    if (anoMatch) {
      anos.push(Number.parseInt(anoMatch[0], 10));
      cur++;
    } else {
      if (s === "," || s === "") {
        cur++;
        continue;
      }
      break;
    }
  }
  return { anos, nextIndex: cur };
}

// parsePdfRows: exceção pragmática — encapsula conhecimento do formato do PDF governamental
// (IO via pdfjs). Worker deve estar configurado pelo caller antes de invocar.
export async function parsePdfRows(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PdfRow[]> {
  const pdfjs = await import("pdfjs-dist");
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const rows: PdfRow[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = content.items
      .map((i) => ("str" in i ? i.str.trim() : ""))
      .filter(Boolean);

    let lastRecordEnd = 0;

    for (let i = 0; i < lines.length; i++) {
      const cpfMatch = /^[Xx\d]{3}\.\d{3}\.\d{3}-[Xx\d]{2}$/.exec(lines[i]);
      if (cpfMatch) {
        const nome = extractNome(lines, lastRecordEnd, i);
        const refAnos = extractAnos(lines, i + 3);
        lastRecordEnd = refAnos.nextIndex;

        if (refAnos.anos.length > 0) {
          rows.push({
            id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            nome,
            cpfMascarado: cpfMatch[0],
            anosPendentes: refAnos.anos,
          });
        }
      }
    }

    page.cleanup();

    if (p % 50 === 0) {
      await new Promise((r) => setTimeout(r, 0));
      if (onProgress) onProgress(Math.floor((p / pdf.numPages) * 70));
    }
  }

  await pdf.destroy();
  return rows;
}

// ── Indexação e reconciliação ─────────────────────────────────────────────────

export function buildMemberIndex(members: ReapMember[]): Map<string, ReapMember[]> {
  const map = new Map<string, ReapMember[]>();
  for (const member of members) {
    if (!member.cpf) continue;
    const middle = member.cpf.replaceAll(/\D/g, "").substring(3, 9);
    if (!map.has(middle)) {
      map.set(middle, []);
    }
    const arr = map.get(middle);
    if (arr) arr.push(member);
  }
  return map;
}

export async function reconcileRows(
  rows: PdfRow[],
  hash: Map<string, ReapMember[]>
): Promise<ReconciliationResult[]> {
  const reconciled: ReconciliationResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowMiddle = row.cpfMascarado.replaceAll(/\D/g, "").replaceAll(/x/gi, "");
    const candidates = hash.get(rowMiddle) || [];

    for (const member of candidates) {
      if (!member.nome) continue;

      if (nomeMatchFn(member.nome, row.nome)) {
        const matchType = row.nome.replaceAll(/X/gi, "").trim().length > 3 ? "FULL" : "PARCIAL";
        reconciled.push({
          id: row.id,
          pdfNome: row.nome,
          pdfCpf: row.cpfMascarado,
          anosPendentes: row.anosPendentes,
          cpfMatch: member.cpf,
          nomeMatch: member.nome,
          matchType,
          selected: matchType === "FULL",
        });
        break;
      }
    }

    if (i % 5000 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return reconciled;
}
