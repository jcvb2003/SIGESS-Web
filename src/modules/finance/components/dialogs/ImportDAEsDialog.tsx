import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FileUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { daeService } from "../../services/daeService";
import { financeQueryKeys } from "../../queryKeys";
import { getTodayISO } from "@/shared/utils/date";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface ExtractedEntry {
  cpf: string | null;
  nome: string | null;
  competenciaMes: number | null;
  competenciaAno: number | null;
  valor: number | null;
  fileName: string;
  status: "ok" | "erro_extracao" | "nao_encontrado" | "ja_registrado";
}

interface ImportDAEsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTH_MAP: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function cleanCpf(value: string) {
  return value.replaceAll(/\D/g, "");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractCpf(text: string): string | null {
  const cpfIdx = text.search(/\bCPF\b/i);
  if (cpfIdx !== -1) {
    const nearby = text.slice(cpfIdx + 3, cpfIdx + 80);
    const digits = nearby.replaceAll(/\D/g, "");
    if (digits.length >= 11) {
      const d = digits.slice(0, 11);
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
  }

  return /(\d{3}\.\d{3}\.\d{3}-\d{2})/.exec(text)?.[1] ?? null;
}

function extractName(text: string, cpf: string | null): string | null {
  if (!cpf) return null;

  const escapedCpf = cpf.replaceAll(".", "\\.").replaceAll("-", "\\-");
  const headerMatch = new RegExp(`${escapedCpf}\\s+([A-ZÀ-Ú\\s]+)\\s+Período de Apuração`, "i").exec(text);
  if (headerMatch?.[1]) {
    return headerMatch[1].trim().replaceAll(/\s+/g, " ");
  }

  const nomeLabelMatch = /CPF\s+Nome\s+[\s\S]*?\n/i.exec(text);
  if (nomeLabelMatch) {
    return null;
  }

  return null;
}

function extractCompetencia(text: string): { mes: number | null; ano: number | null } {
  const periodoExtenso = /Período de Apuração\s+([A-Za-zÀ-úçÇ]+)\/(\d{4})/i.exec(text);
  if (periodoExtenso) {
    const mes = MONTH_MAP[normalizeText(periodoExtenso[1])];
    return { mes: mes ?? null, ano: Number(periodoExtenso[2]) };
  }

  const periodoNumerico = /PA:(\d{2})\/(\d{4})/i.exec(text);
  if (periodoNumerico) {
    return { mes: Number(periodoNumerico[1]), ano: Number(periodoNumerico[2]) };
  }

  return { mes: null, ano: null };
}

function extractValor(text: string): number | null {
  const match = /Valor Total do Documento\s+([\d.,]+)/i.exec(text) ?? /Valor:\s*([\d.,]+)/i.exec(text);
  if (!match?.[1]) return null;

  const normalized = match[1].replaceAll(".", "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

async function extractFromPdf(file: File): Promise<{
  cpf: string | null;
  nome: string | null;
  competenciaMes: number | null;
  competenciaAno: number | null;
  valor: number | null;
}> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  let fullText = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += `${content.items.map((i) => ("str" in i ? i.str : "")).join(" ")}\n`;
    page.cleanup();
  }

  await pdf.destroy();

  const cpf = extractCpf(fullText);
  const nome = extractName(fullText, cpf);
  const competencia = extractCompetencia(fullText);
  const valor = extractValor(fullText);

  return {
    cpf,
    nome,
    competenciaMes: competencia.mes,
    competenciaAno: competencia.ano,
    valor,
  };
}

function formatCompetencia(entry: ExtractedEntry) {
  if (!entry.competenciaMes || !entry.competenciaAno) return "Competência não extraída";
  return `${String(entry.competenciaMes).padStart(2, "0")}/${entry.competenciaAno}`;
}

export function ImportDAEsDialog({
  open,
  onOpenChange,
}: Readonly<ImportDAEsDialogProps>) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entries, setEntries] = useState<ExtractedEntry[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [markAsPaid, setMarkAsPaid] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const context = await daeService.getImportContext();
      const cpfSet = new Set(context.members.map((m) => cleanCpf(m.cpf)));

      const extracted: ExtractedEntry[] = [];
      let skipped = 0;
      let done = 0;

      const CONCURRENCY = 10;
      const results: ExtractedEntry[] = new Array(files.length);

      for (let start = 0; start < files.length; start += CONCURRENCY) {
        const chunk = files.slice(start, start + CONCURRENCY);
        await Promise.all(
          chunk.map(async (file, offset) => {
            const idx = start + offset;
            try {
              const { cpf, nome, competenciaMes, competenciaAno, valor } = await extractFromPdf(file);
              const normalizedCpf = cpf ? cleanCpf(cpf) : "";
              const existingKey = normalizedCpf && competenciaAno && competenciaMes
                ? `${normalizedCpf}-${competenciaAno}-${competenciaMes}`
                : null;

              if (!cpf || !competenciaMes || !competenciaAno || valor === null) {
                results[idx] = {
                  cpf,
                  nome,
                  competenciaMes,
                  competenciaAno,
                  valor,
                  fileName: file.name,
                  status: "erro_extracao",
                };
              } else if (!cpfSet.has(normalizedCpf)) {
                results[idx] = {
                  cpf,
                  nome,
                  competenciaMes,
                  competenciaAno,
                  valor,
                  fileName: file.name,
                  status: "nao_encontrado",
                };
              } else if (existingKey && context.activeKeys.has(existingKey)) {
                results[idx] = {
                  cpf,
                  nome,
                  competenciaMes,
                  competenciaAno,
                  valor,
                  fileName: file.name,
                  status: "ja_registrado",
                };
              } else {
                results[idx] = {
                  cpf,
                  nome,
                  competenciaMes,
                  competenciaAno,
                  valor,
                  fileName: file.name,
                  status: "ok",
                };
              }
            } catch {
              results[idx] = {
                cpf: null,
                nome: null,
                competenciaMes: null,
                competenciaAno: null,
                valor: null,
                fileName: file.name,
                status: "erro_extracao",
              };
            }

            done++;
            setProgress(Math.round((done / files.length) * 100));
          }),
        );
      }

      const seenKeys = new Set<string>(context.activeKeys);

      for (const result of results) {
        if (
          result.status === "ok" &&
          result.cpf &&
          result.competenciaAno &&
          result.competenciaMes
        ) {
          const key = `${cleanCpf(result.cpf)}-${result.competenciaAno}-${result.competenciaMes}`;
          if (seenKeys.has(key)) {
            result.status = "ja_registrado";
          } else {
            seenKeys.add(key);
          }
        }

        if (result.status === "ja_registrado") skipped++;
        else extracted.push(result);
      }

      setEntries(extracted);
      setSkippedCount(skipped);
      setStep("results");

      const message = skipped > 0
        ? `${extracted.length} arquivo(s) processado(s). ${skipped} já registrado(s) ignorado(s).`
        : `${extracted.length} arquivo(s) processado(s).`;
      toast.success(message);
    } catch {
      toast.error("Erro ao processar arquivos.");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  }, []);

  const handleConfirmar = async () => {
    const today = getTodayISO();
    const deduped = new Map<
      string,
      {
        cpf: string;
        competenciaAno: number;
        competenciaMes: number;
        valor: number;
        dataRecebimento: string;
        boletoPago: boolean;
        dataPagamentoBoleto: string | null;
        tipoBoleto: "unitario";
      }
    >();

    for (const entry of entries) {
      if (
        entry.status !== "ok" ||
        !entry.cpf ||
        !entry.competenciaAno ||
        !entry.competenciaMes ||
        entry.valor === null
      ) {
        continue;
      }

      const key = `${cleanCpf(entry.cpf)}-${entry.competenciaAno}-${entry.competenciaMes}`;
      if (deduped.has(key)) continue;

      deduped.set(key, {
        cpf: entry.cpf,
        competenciaAno: entry.competenciaAno,
        competenciaMes: entry.competenciaMes,
        valor: entry.valor,
        dataRecebimento: today,
        boletoPago: markAsPaid,
        dataPagamentoBoleto: markAsPaid ? today : null,
        tipoBoleto: "unitario",
      });
    }

    const toImport = Array.from(deduped.values());

    if (toImport.length === 0) {
      toast.error("Nenhuma guia válida para importar.");
      return;
    }

    setIsSaving(true);
    try {
      await daeService.importDAEs(toImport);
      toast.success(`${toImport.length} DAE(s) importado(s) com sucesso.`);
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      handleClose();
    } catch {
      toast.error("Erro ao salvar DAEs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setEntries([]);
    setProgress(0);
    setSkippedCount(0);
    setMarkAsPaid(false);
    onOpenChange(false);
  };

  const counts = {
    ok: entries.filter((entry) => entry.status === "ok").length,
    naoEncontrado: entries.filter((entry) => entry.status === "nao_encontrado").length,
    erroExtracao: entries.filter((entry) => entry.status === "erro_extracao").length,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300",
          step === "results" ? "max-w-2xl h-[80vh] flex flex-col" : "max-w-lg",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            {step === "results" ? "Resultado da Importação" : "Importar Guias DAE"}
          </DialogTitle>
          <DialogDescription>
            {step === "results"
              ? `${entries.length} arquivo(s) processados.`
              : "Selecione os PDFs de guias DAE para importação em lote."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-2">
          {step === "upload" && (
            <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-xl gap-4 hover:border-primary/50 transition-colors">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4 py-8 w-full max-w-xs">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
                  <Progress value={progress} className="h-2 w-full" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Processando PDFs... {progress}%
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Clique ou arraste os arquivos aqui</p>
                    <p className="text-sm text-muted-foreground">Guias DAE em PDF (.pdf)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    id="dae-pdf-upload"
                    onChange={handleFileUpload}
                  />
                  <Button asChild>
                    <label htmlFor="dae-pdf-upload" className="cursor-pointer">
                      Selecionar Arquivos
                    </label>
                  </Button>
                </>
              )}
            </div>
          )}

          {step === "results" && (
            <div className="flex flex-col h-full gap-4">
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="divide-y">
                  {entries.map((entry) => (
                    <div key={entry.fileName + (entry.cpf || "")} className="flex items-center justify-between px-4 py-2.5 gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {entry.nome ?? "Sócio não identificado"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.cpf ?? "CPF não extraído"}
                          {" · "}
                          {formatCompetencia(entry)}
                          {entry.valor !== null ? ` · R$ ${entry.valor.toFixed(2).replace(".", ",")}` : ""}
                        </span>
                      </div>
                      {entry.status === "ok" && (
                        <Badge className="bg-primary hover:bg-primary/90 shrink-0">Pronto</Badge>
                      )}
                      {entry.status === "nao_encontrado" && (
                        <Badge variant="destructive" className="shrink-0">CPF não encontrado</Badge>
                      )}
                      {entry.status === "erro_extracao" && (
                        <Badge variant="outline" className="border-amber-400 text-amber-600 shrink-0">
                          Erro na extração
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                <Checkbox
                  id="import-dae-mark-paid"
                  checked={markAsPaid}
                  onCheckedChange={(checked) => setMarkAsPaid(checked === true)}
                />
                <label
                  htmlFor="import-dae-mark-paid"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Marcar boleto como pago ao importar
                </label>
              </div>

              <div className={`grid gap-3 ${skippedCount > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{counts.ok}</p>
                    <p className="text-xs text-muted-foreground">Para importar</p>
                  </div>
                </div>
                {skippedCount > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{skippedCount}</p>
                      <p className="text-xs text-muted-foreground">Já registrados</p>
                    </div>
                  </div>
                )}
                <div className="bg-muted/30 border border-border p-3 rounded-lg flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{counts.naoEncontrado + counts.erroExtracao}</p>
                    <p className="text-xs text-muted-foreground">Com problemas</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          {step === "results" && (
            <Button
              onClick={handleConfirmar}
              disabled={isSaving || counts.ok === 0}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Importar {counts.ok} guia(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
