import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { requirementService } from "../services/requirementService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { useQueryClient } from "@tanstack/react-query";
import { requirementQueryKeys } from "../queryKeys";
import { read, utils } from "xlsx";
import { Loader2, FileUp, AlertTriangle, CheckCircle2, UserX, Info } from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { DataTable, ColumnDef } from "@/shared/components/layout/DataTable";

interface ImportPortalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anoAtual: number;
}

import {
  ReconciliationResult,
  buildMemberIndexes,
  reconcileRow
} from "../services/reconciliationService";

export function ImportPortalDialog({
  open,
  onOpenChange,
  anoAtual,
}: Readonly<ImportPortalDialogProps>) {
  const queryClient = useQueryClient();
  const { unitId } = useActiveScope();
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'upload' | 'results'>('upload');
  const [progress, setProgress] = useState(0);

  const handleToggleSelectAll = useCallback((checked: boolean) => {
    setResults(prev => prev.map(r => ({ ...r, selected: !!checked })));
  }, []);

  const handleToggleSelectItem = useCallback((index: number, checked: boolean) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, selected: !!checked } : r));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);
    try {
      const context = await requirementService.getReconciliationContext(unitId);
      const indexes = buildMemberIndexes(context.members);

      // Pequena pausa para garantir que o navegador renderize o estado de "Analisando"
      await new Promise(resolve => setTimeout(resolve, 300));

      const buffer = await file.arrayBuffer();

      // Nova pausa após ler o buffer para evitar travamento na análise do workbook
      await new Promise(resolve => setTimeout(resolve, 100));
      const workbook = read(buffer);
      const jsonData = utils.sheet_to_json<Record<string, string>>(workbook.Sheets[workbook.SheetNames[0]]);

      const reconciled: ReconciliationResult[] = [];
      const chunkSize = 500;

      const processChunk = async (startIndex: number) => {
        const endIndex = Math.min(startIndex + chunkSize, jsonData.length);

        for (let i = startIndex; i < endIndex; i++) {
          const result = reconcileRow(jsonData[i], context, indexes, anoAtual);
          if (result) {
            reconciled.push(result);
          }
        }

        const currentProgress = Math.round((endIndex / jsonData.length) * 100);
        setProgress(currentProgress);

        if (endIndex < jsonData.length) {
          // Pausa a cada chunk para o navegador respirar e renderizar o spin/progresso
          await new Promise(resolve => setTimeout(resolve, 0));
          await processChunk(endIndex);
        }
      };

      await processChunk(0);

      setResults(reconciled);
      setStep('results');
      toast.success(`Análise concluída: ${reconciled.length} correspondências encontradas.`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar arquivo massivo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchConfirm = async () => {
    const selectedIds = results
      .filter((r): r is typeof r & { existingReqId: string } => !!(r.selected && r.existingReqId))
      .map(r => r.existingReqId);

    if (selectedIds.length === 0) {
      toast.error("Nenhum requerimento selecionado.");
      return;
    }

    setIsSaving(true);
    try {
      await requirementService.batchUpdateBeneficio(selectedIds, anoAtual);
      toast.success(`${selectedIds.length} requerimentos atualizados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: requirementQueryKeys.all });
      onOpenChange(false);
      setStep('upload');
      setResults([]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar atualização em lote.");
    } finally {
      setIsSaving(false);
    }
  };

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      // 1. Status (Z-A): 'AGUARDANDO BAIXA' (true) primeiro
      if (a.hasReqCurrentYear !== b.hasReqCurrentYear) {
        return a.hasReqCurrentYear ? -1 : 1;
      }

      // 2. Confiança (Z-A): IDENTIFICADO > APENAS NIT > APENAS NOME
      const weight: Record<string, number> = { FULL: 3, NIT_ONLY: 2, NAME_ONLY: 1, NONE: 0 };
      if (weight[a.matchType] !== weight[b.matchType]) {
        return weight[b.matchType] - weight[a.matchType];
      }

      // 3. Financeiro: EM DIA / ISENTO primeiro, depois ATRASO, por fim N/A
      const getFinanceWeight = (f?: string) => {
        if (!f) return 2; // N/A por último
        const normalized = f.toUpperCase().replace('_', ' ');
        if (normalized === 'EM DIA' || normalized === 'ISENTO') return 0;
        return 1; // ATRASO
      };

      const wA = getFinanceWeight(a.finance);
      const wB = getFinanceWeight(b.finance);
      
      if (wA !== wB) {
        return wA - wB;
      }

      // 4. Sócio (A-Z): Nome em ordem alfabética
      const nameA = a.member?.nome || a.portalName || "";
      const nameB = b.member?.nome || b.portalName || "";
      return nameA.localeCompare(nameB);
    });
  }, [results]);

  const columns = useMemo<ColumnDef<ReconciliationResult>[]>(() => [
    {
      header: (
        <div className="flex justify-center w-full">
          <Checkbox 
            checked={results.length > 0 && results.every(r => r.selected)}
            onCheckedChange={handleToggleSelectAll}
          />
        </div>
      ),
      className: "w-12 text-center px-0",
      cell: (res) => (
        <div className="flex justify-center w-full">
          <Checkbox 
            checked={res.selected}
            disabled={!res.hasReqCurrentYear}
            onCheckedChange={(checked) => {
              const index = results.indexOf(res);
              if (index !== -1) handleToggleSelectItem(index, !!checked);
            }}
          />
        </div>
      )
    },
    {
      header: "Portal (CSV)",
      className: "min-w-[180px]",
      cell: (res) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground/90">{res.portalName}</span>
          <span className="text-[10px] text-muted-foreground opacity-70 uppercase">NIT: {res.portalNit}</span>
        </div>
      )
    },
    {
      header: "Sócio (SIGESS)",
      className: "min-w-[180px]",
      cell: (res) => res.member ? (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-foreground/90 uppercase">{res.member.nome}</span>
          <span className="text-[10px] text-muted-foreground opacity-70">CPF: {res.member.cpf}</span>
        </div>
      ) : (
        <Badge variant="outline" className="text-[10px] gap-1 border-dashed">
          <UserX className="h-3 w-3" /> NÃO ENCONTRADO
        </Badge>
      )
    },
    {
      header: "Confiança",
      className: "text-center",
      headerClassName: "text-center",
      cell: (res) => {
        if (res.matchType === 'FULL') return <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-success/20 text-[10px]">IDENTIFICADO</Badge>;
        if (res.matchType === 'NIT_ONLY') return <Badge variant="secondary" className="bg-warning text-warning-foreground hover:bg-warning/90 text-[10px]">APENAS NIT</Badge>;
        return <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700 text-[10px]">APENAS NOME</Badge>;
      }
    },
    {
      header: "Financeiro",
      className: "text-center",
      headerClassName: "text-center",
      cell: (res) => {
        const isDia = res.finance === 'EM DIA' || res.finance === 'EM_DIA' || res.finance === 'ISENTO';
        return (
          <Badge 
            variant={isDia ? "outline" : "destructive"} 
            className={cn(
              "text-[10px]",
              isDia ? "border-success/50 text-success bg-success/5" : "bg-red-600"
            )}
          >
            {res.finance?.replace('_', ' ') || 'NÃO INFORMADO'}
          </Badge>
        );
      }
    },
    {
      header: "Status",
      className: "text-right",
      headerClassName: "text-right",
      cell: (res) => res.hasReqCurrentYear ? (
        <Badge variant="outline" className="border-primary/50 text-primary text-[10px] whitespace-nowrap">AGUARDANDO BAIXA</Badge>
      ) : (
        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] whitespace-nowrap">SEM REQUERIMENTO {anoAtual}</Badge>
      )
    }
  ], [results, handleToggleSelectAll, handleToggleSelectItem, anoAtual]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl transition-all duration-300", step === 'results' ? "max-w-5xl h-[85vh] flex flex-col" : "max-w-xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            {step === 'results' ? 'Resultado do Cruzamento' : 'Rastrear Pagamentos no Portal da Transparência'}
          </DialogTitle>
          <DialogDescription>
            {step === 'results'
              ? `Encontramos ${results.length} socios correspondentes para o ano de ${anoAtual}.`
              : (
                <>
                  Selecione o arquivo CSV baixado do{" "}
                  <a
                    href="https://portaldatransparencia.gov.br/download-de-dados/seguro-defeso"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline underline-offset-4"
                  >
                    Portal da Transparencia
                  </a>{" "}
                  para identificar quem já recebeu o pagamento em conta.
                </>
              )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          {step === 'upload' ? (
            <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-xl gap-4 hover:border-primary/50 transition-colors">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6">
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
                    <p className="text-sm text-muted-foreground">Arquivo CSV do Seguro Defeso (.csv)</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={handleFileUpload}
                    disabled={isAnalyzing}
                  />
                  <Button asChild>
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      Selecionar Arquivo
                    </label>
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              <ScrollArea className="flex-1 border rounded-lg bg-card">
                <DataTable<ReconciliationResult>
                  data={sortedResults}
                  columns={columns}
                  variant="minimal"
                  rowClassName={(res) => cn(
                    "group",
                    res.hasReqCurrentYear ? "bg-primary/[0.02]" : "opacity-50 grayscale-[0.5]"
                  )}
                />
              </ScrollArea>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{results.filter(r => r.matchType === 'FULL').length}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Alta Confiança</span>
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-amber-600/10 rounded-full flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{results.filter(r => r.matchType === 'NAME_ONLY' || r.matchType === 'NIT_ONLY').length}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Revisão Manual</span>
                  </div>
                </div>

                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Info className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{results.filter(r => r.selected).length}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Selecionados</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setStep('upload');
            setResults([]);
          }} disabled={isSaving}>
            Cancelar
          </Button>
          {step === 'results' && (
            <Button onClick={handleBatchConfirm} disabled={isSaving || results.filter(r => r.selected).length === 0} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar {results.filter(r => r.selected).length} Pagamentos
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
