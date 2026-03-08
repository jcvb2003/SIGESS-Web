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
import { FileUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { reapService } from "../services/reapService";
import { reapQueryKeys } from "../queryKeys";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import * as pdfjs from "pdfjs-dist";

// Worker para PDF.js (deve estar configurado no projeto)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ExtractedEntry {
  cpf: string | null;
  dataEnvio: string | null;
  anoRef: number | null;
  fileName: string;
  status: "ok" | "erro_extracao" | "nao_encontrado" | "ja_registrado";
}

interface ImportComprovantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function extractFromPdf(file: File): Promise<{
  cpf: string | null;
  dataEnvio: string | null;
  anoRef: number | null;
}> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  let fullText = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map((i) => ("str" in i ? i.str : "")).join(" ");
  }

  const cpf = fullText.match(/CPF[:\s]*([\d]{3}\.[\d]{3}\.[\d]{3}-[\d]{2})/)?.[1] ?? null;
  const dataEnvioRaw = fullText.match(/Data\s+do\s+Envio[:\s]*(\d{2}\/\d{2}\/\d{4})/)?.[1] ?? null;
  const anoRefRaw = fullText.match(/Ano\s+de\s+Refer[êe]ncia[:\s]*(\d{4})/)?.[1] ?? null;

  // Converte DD/MM/YYYY para YYYY-MM-DD
  let dataEnvio: string | null = null;
  if (dataEnvioRaw) {
    const [d, m, a] = dataEnvioRaw.split("/");
    dataEnvio = `${a}-${m}-${d}`;
  }

  return { cpf, dataEnvio, anoRef: anoRefRaw ? Number(anoRefRaw) : null };
}

export function ImportComprovantesDialog({
  open,
  onOpenChange,
}: Readonly<ImportComprovantesDialogProps>) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [entries, setEntries] = useState<ExtractedEntry[]>([]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      setIsProcessing(true);
      setProgress(0);

      try {
        const context = await reapService.getReconciliationContext();
        const cpfSet = new Set(context.members.map((m) => m.cpf));

        const extracted: ExtractedEntry[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const { cpf, dataEnvio, anoRef } = await extractFromPdf(file);

            if (!cpf || !dataEnvio || !anoRef) {
              extracted.push({ cpf, dataEnvio, anoRef, fileName: file.name, status: "erro_extracao" });
            } else if (!cpfSet.has(cpf)) {
              extracted.push({ cpf, dataEnvio, anoRef, fileName: file.name, status: "nao_encontrado" });
            } else {
              // Verifica se já está registrado
              const member = context.members.find((m) => m.cpf === cpf);
              const jaRegistrado = member?.reap?.anual?.[String(anoRef)]?.enviado && member?.reap?.anual?.[String(anoRef)]?.data_envio;
              extracted.push({
                cpf,
                dataEnvio,
                anoRef,
                fileName: file.name,
                status: jaRegistrado ? "ja_registrado" : "ok",
              });
            }
          } catch {
            extracted.push({ cpf: null, dataEnvio: null, anoRef: null, fileName: file.name, status: "erro_extracao" });
          }

          setProgress(Math.round(((i + 1) / files.length) * 100));
        }

        setEntries(extracted);
        setStep("results");
        toast.success(`${extracted.length} arquivo(s) processado(s).`);
      } catch {
        toast.error("Erro ao processar arquivos.");
      } finally {
        setIsProcessing(false);
        // Reset input
        e.target.value = "";
      }
    },
    []
  );

  const handleConfirmar = async () => {
    const paraImportar = entries
      .filter((e) => e.status === "ok" && e.cpf && e.dataEnvio && e.anoRef)
      .map((e) => ({ cpf: e.cpf!, ano: e.anoRef!, dataEnvio: e.dataEnvio! }));

    if (paraImportar.length === 0) {
      toast.error("Nenhum comprovante válido para importar.");
      return;
    }

    setIsSaving(true);
    try {
      await reapService.importComprovantes(paraImportar);
      toast.success(`${paraImportar.length} REAP(s) importado(s) com sucesso.`);
      queryClient.invalidateQueries({ queryKey: reapQueryKeys.all });
      handleClose();
    } catch {
      toast.error("Erro ao salvar comprovantes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setEntries([]);
    setProgress(0);
    onOpenChange(false);
  };

  const counts = {
    ok: entries.filter((e) => e.status === "ok").length,
    jaRegistrado: entries.filter((e) => e.status === "ja_registrado").length,
    naoEncontrado: entries.filter((e) => e.status === "nao_encontrado").length,
    erroExtracao: entries.filter((e) => e.status === "erro_extracao").length,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300",
          step === "results" ? "max-w-2xl h-[80vh] flex flex-col" : "max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            {step === "results" ? "Resultado da Importação" : "Importar Comprovantes REAP 2025"}
          </DialogTitle>
          <DialogDescription>
            {step === "results"
              ? `${entries.length} arquivo(s) processados.`
              : "Selecione os PDFs de comprovante do REAP para importação em lote."}
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
                    <p className="text-sm text-muted-foreground">PDFs de comprovante REAP (.pdf)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    id="reap-pdf-upload"
                    onChange={handleFileUpload}
                  />
                  <Button asChild>
                    <label htmlFor="reap-pdf-upload" className="cursor-pointer">
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
                  {entries.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{entry.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          {entry.cpf ?? "CPF não extraído"}
                          {entry.dataEnvio ? ` · ${entry.dataEnvio}` : ""}
                          {entry.anoRef ? ` · REAP ${entry.anoRef}` : ""}
                        </span>
                      </div>
                      {entry.status === "ok" && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 shrink-0">Pronto</Badge>
                      )}
                      {entry.status === "ja_registrado" && (
                        <Badge variant="secondary" className="shrink-0">Já Registrado</Badge>
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

              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{counts.ok}</p>
                    <p className="text-xs text-muted-foreground">Para importar</p>
                  </div>
                </div>
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
              Importar {counts.ok} comprovante(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
