import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { requirementService } from "../services/requirementService";
import { useQueryClient } from "@tanstack/react-query";
import { requirementQueryKeys } from "../queryKeys";
import { read, utils } from "xlsx";
import { Loader2, FileUp, AlertTriangle, CheckCircle2, UserX, Info } from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

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
      const context = await requirementService.getReconciliationContext();
      const indexes = buildMemberIndexes(context.members);
      
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const jsonData = utils.sheet_to_json<Record<string, string>>(workbook.Sheets[workbook.SheetNames[0]]);

      const reconciled: ReconciliationResult[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const result = reconcileRow(jsonData[i], context, indexes, anoAtual);
        if (result) {
          reconciled.push(result);
        }
        
        if (i % 1000 === 0 || i === jsonData.length - 1) {
          setProgress(Math.round(((i + 1) / jsonData.length) * 100));
        }
      }

      setResults(reconciled);
      setStep('results');
      toast.success(`Analise concluida: ${reconciled.length} correspondencias encontradas.`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl transition-all duration-300", step === 'results' ? "max-w-5xl h-[85vh] flex flex-col" : "max-w-xl")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            {step === 'results' ? 'Resultado do Cruzamento' : 'Importar Seguro Defeso (Portal da Transparência)'}
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
                  para verificar os pagamentos recebidos.
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
                    <Progress value={progress} className="h-2" />
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
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <Checkbox 
                          checked={results.every(r => r.selected) && results.length > 0}
                          onCheckedChange={handleToggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Portal (CSV)</TableHead>
                      <TableHead>Socio (SIGESS)</TableHead>
                      <TableHead>Tipo Match</TableHead>
                      <TableHead>Financeiro</TableHead>
                      <TableHead>Status Atual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((res, index) => (
                      <TableRow key={`${res.portalNit}-${index}`} className={cn(res.hasReqCurrentYear ? "bg-primary/5" : "opacity-60")}>
                        <TableCell className="text-center">
                          <Checkbox 
                            checked={res.selected}
                            disabled={!res.hasReqCurrentYear}
                            onCheckedChange={(checked) => handleToggleSelectItem(index, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{res.portalName}</span>
                            <span className="text-xs text-muted-foreground">NIT: {res.portalNit}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {res.member ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{res.member.nome}</span>
                              <span className="text-xs text-muted-foreground">CPF: {res.member.cpf}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1">
                              <UserX className="h-3 w-3" /> Nao Encontrado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {res.matchType === 'FULL' && <Badge className="bg-green-600 hover:bg-green-700">NIT + Nome</Badge>}
                          {res.matchType === 'NIT_ONLY' && <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">NIT</Badge>}
                          {res.matchType === 'NAME_ONLY' && <Badge variant="secondary" className="bg-amber-600 text-white hover:bg-amber-700">Nome</Badge>}
                        </TableCell>
                        <TableCell>
                          {res.finance === 'REGULAR' ? (
                            <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20">Regular</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-600">Atraso</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {res.hasReqCurrentYear ? (
                            <Badge variant="outline" className="border-primary/50 text-primary">Aguardando Baixa</Badge>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Sem Requerimento em {anoAtual}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-600/10 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{results.filter(r => r.matchType === 'FULL' || r.matchType === 'NIT_ONLY').length}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Alta Confianca</span>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                  <div className="h-8 w-8 bg-amber-600/10 rounded-full flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">{results.filter(r => r.matchType === 'NAME_ONLY').length}</span>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Revisao Manual</span>
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
