import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Progress } from "@/shared/components/ui/progress";
import { FileUp, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { reapService } from "../services/reapService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { reapQueryKeys } from "../queryKeys";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { DataTable, ColumnDef } from "@/shared/components/layout/DataTable";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  type ReconciliationResult,
  parsePdfRows,
  buildMemberIndex,
  reconcileRows,
} from "../domain/reapPendencias";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;


interface ConsultarPendenciasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultarPendenciasDialog({
  open,
  onOpenChange,
}: Readonly<ConsultarPendenciasDialogProps>) {
  const queryClient = useQueryClient();
  const { unitId } = useActiveScope();
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
      const context = await reapService.getReconciliationContext(unitId);
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

  const columns = useMemo<ColumnDef<ReconciliationResult>[]>(() => [
    {
      header: (
        <div className="flex justify-center w-full">
          <Checkbox 
            checked={results.length > 0 && results.every(r => r.selected)}
            onCheckedChange={handleToggleAll}
          />
        </div>
      ),
      className: "w-12 text-center px-0",
      cell: (res) => (
        <div className="flex justify-center w-full">
          <Checkbox 
            checked={res.selected}
            onCheckedChange={(checked) => {
              const index = results.indexOf(res);
              if (index !== -1) handleToggleItem(index, !!checked);
            }}
          />
        </div>
      )
    },
    {
      header: "PDF (Lista Gov.)",
      className: "min-w-[180px]",
      cell: (res) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground/90">{res.pdfNome}</span>
          <span className="text-[10px] text-muted-foreground opacity-70 uppercase">{res.pdfCpf}</span>
        </div>
      )
    },
    {
      header: "Sócio (SIGESS)",
      className: "min-w-[180px]",
      cell: (res) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground/90 uppercase">{res.nomeMatch}</span>
          <span className="text-[10px] text-muted-foreground opacity-70">CPF: {res.cpfMatch}</span>
        </div>
      )
    },
    {
      header: "Confiança",
      className: "text-center",
      headerClassName: "text-center",
      cell: (res) => res.matchType === "FULL" ? (
        <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20 text-[10px]">
          CPF + NOME
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700 text-[10px]">
          PARCIAL
        </Badge>
      )
    },
    {
      header: "Anos Pendentes",
      cell: (res) => (
        <div className="flex flex-wrap gap-1">
          {res.anosPendentes.map((ano) => (
            <Badge 
              key={ano} 
              variant="secondary" 
              className="text-[10px] bg-sky-600/10 text-sky-600 hover:bg-sky-600/20 border-sky-600/20"
            >
              {ano}
            </Badge>
          ))}
        </div>
      )
    }
  ], [results, handleToggleAll, handleToggleItem]);

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
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold">{progress}%</span>
                    </div>
                  </div>

                  <div className="w-full max-w-xs space-y-2">
                    <Progress value={progress} className="h-2 bg-muted" />
                    <p className="text-center text-sm text-muted-foreground animate-pulse">
                      Cruzando dados com o banco do SIGESS...
                    </p>
                  </div>
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
                <DataTable<ReconciliationResult>
                  data={results}
                  columns={columns}
                  variant="minimal"
                  rowClassName={() => "group"}
                />
              </ScrollArea>

              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center text-success">
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
