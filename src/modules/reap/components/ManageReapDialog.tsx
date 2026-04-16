import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { reapService } from "../services/reapService";
import {
  ReapWithMember,
  ReapAnoSimplificado,
  ReapAnoAnual,
  ANOS_SIMPLIFICADO,
  ANO_INICIAL_ANUAL,
  ANO_ATUAL,
} from "../types/reap.types";
import { reapQueryKeys } from "../queryKeys";
import { AlertTriangle, Save, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface ManageReapDialogProps {
  member: ReapWithMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageReapDialog({
  member,
  open,
  onOpenChange,
}: Readonly<ManageReapDialogProps>) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Estado local para edições
  const [observacoes, setObservacoes] = useState(member?.observacoes ?? "");
  const [simplificadoState, setSimplificadoState] = useState<Record<string, ReapAnoSimplificado>>({});
  const [anualState, setAnualState] = useState<Record<string, ReapAnoAnual>>({});

  // Inicializa o estado quando o membro muda
  React.useEffect(() => {
    if (member) {
      setObservacoes(member.observacoes ?? "");

      const simp: typeof simplificadoState = {};
      ANOS_SIMPLIFICADO.forEach(ano => {
        const data = member.simplificado[String(ano)];
        simp[String(ano)] = {
          enviado: data?.enviado ?? false,
          tem_problema: data?.tem_problema ?? false,
          obs: data?.obs ?? null,
        };
      });
      setSimplificadoState(simp);

      const anua: typeof anualState = {};
      const anoRgp = member.emissao_rgp ? new Date(member.emissao_rgp).getFullYear() : ANO_INICIAL_ANUAL;
      const startYear = Math.max(anoRgp, ANO_INICIAL_ANUAL);
      for (let a = startYear; a <= ANO_ATUAL - 1; a++) {
        const data = member.anual[String(a)];
        anua[String(a)] = {
          enviado: data?.enviado ?? false,
          data_envio: data?.data_envio ?? null,
          tem_problema: data?.tem_problema ?? false,
          obs: data?.obs ?? null,
        };
      }
      setAnualState(anua);
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;
    setIsSaving(true);
    try {
      // Salva tudo em uma única requisição (RPC batch) para evitar ERR_INSUFFICIENT_RESOURCES
      await reapService.updateFullReap(
        member.cpf,
        simplificadoState,
        anualState,
        observacoes
      );

      toast.success("Dados do REAP atualizados com sucesso.");
      queryClient.invalidateQueries({ queryKey: reapQueryKeys.all });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            Gerenciar REAP: {member.member_nome}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-mono">CPF: {member.cpf}</p>
        </DialogHeader>

        {/* Scroll nativo para evitar problemas com componentes complexos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Observações Gerais */}
          <div className="space-y-2">
            <Label htmlFor="obs-geral" className="text-sm font-semibold text-primary">
              Observações Gerais do REAP
            </Label>
            <Textarea
              id="obs-geral"
              placeholder="Ex: Endereço em outro município, bacia divergente etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-[11px] text-muted-foreground italic">
              Esta nota é física e centralizada para todos os anos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simplificado */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm border-b pb-1 flex items-center gap-2">
                Simplificado (2021-2024)
              </h4>
              {ANOS_SIMPLIFICADO.map((ano) => (
                <div key={ano} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{ano}</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      simplificadoState[String(ano)]?.enviado ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {simplificadoState[String(ano)]?.enviado ? "Concluído" : "Pendente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-full",
                              simplificadoState[String(ano)]?.tem_problema ? "text-amber-500 bg-amber-100" : "text-muted-foreground"
                            )}
                            onClick={() => setSimplificadoState(prev => ({
                              ...prev,
                              [String(ano)]: { ...prev[String(ano)], tem_problema: !prev[String(ano)].tem_problema }
                            }))}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marcar Problema</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Switch
                      checked={simplificadoState[String(ano)]?.enviado ?? false}
                      onCheckedChange={(val) => setSimplificadoState(prev => ({
                        ...prev,
                        [String(ano)]: { ...prev[String(ano)], enviado: val }
                      }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Anual */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm border-b pb-1">Anual (2025+)</h4>
              {Object.keys(anualState).sort((a, b) => a.localeCompare(b)).map((ano) => (
                <div key={ano} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{ano}</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      anualState[String(ano)]?.enviado ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {anualState[String(ano)]?.enviado ? "Concluído" : "Pendente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full",
                        anualState[String(ano)]?.tem_problema ? "text-amber-500 bg-amber-100" : "text-muted-foreground"
                      )}
                      onClick={() => setAnualState(prev => ({
                        ...prev,
                        [String(ano)]: { ...prev[String(ano)], tem_problema: !prev[String(ano)].tem_problema }
                      }))}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={anualState[String(ano)]?.enviado ?? false}
                      onCheckedChange={(val) => setAnualState(prev => ({
                        ...prev,
                        [String(ano)]: { ...prev[String(ano)], enviado: val }
                      }))}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(anualState).length === 0 && (
                <p className="text-[11px] text-muted-foreground italic text-center py-4">
                  Sem ciclos anuais obrigatórios ainda.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
