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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Progress } from "@/shared/components/ui/progress";
import { FileUp, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { reapService } from "../services/reapService";
import { reapQueryKeys } from "../queryKeys";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfRow {
  id: string;
  nome: string;
  cpfMascarado: string;
  anosPendentes: number[];
}

interface ReconciliationResult {
  id: string;
  pdfNome: string;
  pdfCpf: string;
  anosPendentes: number[];
  cpfMatch: string | null;
  nomeMatch: string | null;
  matchType: "FULL" | "PARCIAL" | "NONE";
  selected: boolean;
}

// Motor de match por nome

function nomeMatchFn(nomeCompleto: string, nomeMascarado: string): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replaceAll(/X/gi, "")
      .replaceAll(/[^A-Z\s]/g, "")
      .trim();
  const n1 = norm(nomeCompleto);
  const n2 = norm(nomeMascarado);
  if (n2.length === 0) return false;
  return n1.includes(n2) || n2.includes(n1);
}

function extractNome(lines: string[], startIndex: number, endIndex: number): string {
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

function extractAnos(lines: string[], startIndex: number): { anos: number[]; nextIndex: number } {
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

async function parsePdfRows(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PdfRow[]> {
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
            id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            nome,
            cpfMascarado: cpfMatch[0],
            anosPendentes: refAnos.anos
          });
        }
      }
    }

    // Libera memória C++ / Canvas associada à página
    page.cleanup();

    // Respira o Event Loop do React a cada 50 páginas e atualiza a interface
    if (p % 50 === 0) {
      await new Promise((r) => setTimeout(r, 0));
      if (onProgress) onProgress(Math.floor((p / pdf.numPages) * 70));
    }
  }

  // Destruction completa para não vazar mem no Browser
  await pdf.destroy();

  return rows;
}

type ContextMembers = Awaited<ReturnType<typeof reapService.getReconciliationContext>>["members"];

function buildMemberIndex(members: ContextMembers) {
  const map = new Map<string, ContextMembers>();
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

async function reconcileRows(rows: PdfRow[], hash: Map<string, ContextMembers>): Promise<ReconciliationResult[]> {
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

    if (i % 5000 === 0) await new Promise(r => setTimeout(r, 0));
  }
  return reconciled;
}

interface ConsultarPendenciasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultarPendenciasDialog({
  open,
  onOpenChange,
}: Readonly<ConsultarPendenciasDialogProps>) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"upload" | "results">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [consolidateOthers, setConsolidateOthers] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);

    try {
      const context = await reapService.getReconciliationContext();
      setProgress(5);

      const rows = await parsePdfRows(file, (p) => setProgress(5 + p));
      setProgress(75);

      const membersByMiddleHash = buildMemberIndex(context.members);

      setProgress(85);

      const reconciled = await reconcileRows(rows, membersByMiddleHash);

      setResults(reconciled);
      setProgress(100);
      setStep("results");
      toast.success(`${reconciled.length} correspondência(s) encontrada(s) no SIGESS.`);
    } catch (error) {
      console.error("Erro no processamento do PDF REAP:", error);
      toast.error("Erro ao processar PDF.");
    } finally {
      setIsAnalyzing(false);
      e.target.value = "";
    }
  }, []);

  const handleToggleAll = useCallback((checked: boolean) => {
    setResults((prev) => prev.map((r) => ({ ...r, selected: !!checked })));
  }, []);

  const handleToggleItem = useCallback((index: number, checked: boolean) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, selected: !!checked } : r)));
  }, []);

  const handleConfirmar = async () => {
    const selecionados = results.filter((r) => r.selected && r.cpfMatch);
    if (selecionados.length === 0) {
      toast.error("Nenhuma correspondência selecionada.");
      return;
    }

    setIsSaving(true);
    try {
      await reapService.importPendencias(
        selecionados.map((r) => ({
          cpf: r.cpfMatch ?? "",
          anosSimplificado: r.anosPendentes,
        }))
      );

      if (consolidateOthers) {
        const pendencyCpfs = selecionados.map(r => r.cpfMatch).filter(Boolean) as string[];
        const count = await reapService.consolidateSimplificadoCompleteness(pendencyCpfs);
        toast.info(`${count} outros sócios marcados como "Em Dia".`);
      }

      toast.success(`${selecionados.length} pendência(s) registrada(s).`);
      queryClient.invalidateQueries({ queryKey: reapQueryKeys.all });
      handleClose();
    } catch {
      toast.error("Erro ao registrar pendências.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setResults([]);
    setProgress(0);
    setConsolidateOthers(false);
    onOpenChange(false);
  };

  const selectedCount = results.filter((r) => r.selected).length;
  const fullCount = results.filter((r) => r.matchType === "FULL").length;
  const parcialCount = results.filter((r) => r.matchType === "PARCIAL").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300",
          step === "results" ? "max-w-5xl h-[85vh] flex flex-col" : "max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            {step === "results"
              ? "Resultado da Conciliação"
              : "Consultar Pendências REAP Simplificado"}
          </DialogTitle>
          <DialogDescription>
            {step === "results" ? (
              `${results.length} correspondência(s) encontrada(s) no PDF do governo.`
            ) : (
              <>
                Selecione a lista oficial de pendências publicada pelo governo (PDF).{" "}
                <a
                  href="https://www.gov.br/mpa/pt-br/assuntos/cadastro-registro-e-monitoramento/pescador-e-pescadora-profissional"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium text-xs"
                >
                  (Acessar PDF Base)
                </a>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-2">
          {step === "upload" && (
            <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-xl gap-4 hover:border-primary/50 transition-colors">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4 py-8 w-full max-w-xs">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
                  <Progress value={progress} className="h-2 w-full" />
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Cruzando com base do SIGESS...
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Clique ou arraste o arquivo aqui</p>
                    <p className="text-sm text-muted-foreground">
                      Lista de pendências do governo (.pdf)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    id="reap-pendencias-upload"
                    onChange={handleFileUpload}
                  />
                  <Button asChild>
                    <label htmlFor="reap-pendencias-upload" className="cursor-pointer">
                      Selecionar Arquivo
                    </label>
                  </Button>
                </>
              )}
            </div>
          )}

          {step === "results" && (
            <div className="flex flex-col h-full gap-4">
              <ScrollArea className="flex-1 border rounded-lg bg-card">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={results.every((r) => r.selected) && results.length > 0}
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead>PDF (Lista Gov.)</TableHead>
                      <TableHead>Sócio (SIGESS)</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Anos Pendentes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((res, index) => (
                      <TableRow key={res.id} className="hover:bg-muted/30">
                        <TableCell className="text-center">
                          <Checkbox
                            checked={res.selected}
                            onCheckedChange={(checked) => handleToggleItem(index, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{res.pdfNome}</span>
                            <span className="text-xs text-muted-foreground">{res.pdfCpf}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{res.nomeMatch}</span>
                            <span className="text-xs text-muted-foreground">{res.cpfMatch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {res.matchType === "FULL" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700">
                              CPF + Nome
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700">
                              Parcial
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {res.anosPendentes.map((ano) => (
                              <Badge key={ano} variant="outline" className="text-[10px]">
                                {ano}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-600/10 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{fullCount}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Alta Confiança</span>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-amber-600/10 rounded-full flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{parcialCount}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Revisão Manual</span>
                  </div>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Info className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{selectedCount}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Selecionados</span>
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
            <div className="flex items-center gap-6 mr-auto">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="consolidate-others" 
                  checked={consolidateOthers} 
                  onCheckedChange={setConsolidateOthers}
                />
                <Label htmlFor="consolidate-others" className="text-xs cursor-pointer select-none">
                  Consolidar situação (Marcar demais sócios como "Em Dia")
                </Label>
              </div>
              <Button
                onClick={handleConfirmar}
                disabled={isSaving || selectedCount === 0}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Registrar {selectedCount} pendência(s)
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
