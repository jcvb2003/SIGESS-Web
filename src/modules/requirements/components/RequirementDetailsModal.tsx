import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Separator } from "@/shared/components/ui/separator";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { RequirementStatus } from "../types/requirement.types";
import { useRequirementDetail } from "../hooks/data/useRequirementData";
import { requirementService } from "../services/requirementService";
import { useQueryClient } from "@tanstack/react-query";
import { requirementQueryKeys } from "../queryKeys";
import { format } from "date-fns";
import { Loader2, History, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface RequirementDetailsModalProps {
  requirementId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function RequirementDetailsModal({
  requirementId,
  onOpenChange,
}: Readonly<RequirementDetailsModalProps>) {
  const queryClient = useQueryClient();
  const { requirement, events, isLoading, refetch } = useRequirementDetail(requirementId);
  
  const [status, setStatus] = useState<RequirementStatus>("assinado");
  const [numMte, setNumMte] = useState("");
  const [recebido, setRecebido] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (requirement) {
      setStatus(requirement.status_mte);
      setNumMte(requirement.num_req_mte || "");
      setRecebido(requirement.beneficio_recebido);
    }
  }, [requirement]);

  const handleSave = async () => {
    if (!requirementId || !requirement) return;
    
    setIsSaving(true);
    try {
      // 1. Atualizar Status e Num MTE
      await requirementService.updateStatus(requirementId, requirement.ano_referencia, status, {
        num_req_mte: numMte || null
      });

      // 2. Atualizar Recebimento se mudou
      if (recebido !== requirement?.beneficio_recebido) {
        await requirementService.confirmBeneficio(requirementId, requirement.ano_referencia, recebido);
      }

      toast.success("Alterações salvas com sucesso!");
      
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: requirementQueryKeys.all });
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!requirementId} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 bg-muted/30 border-b">
          <div className="flex flex-col gap-1 text-left">
            <DialogTitle className="text-xl flex items-center gap-2">
              Detalhes do Requerimento
              {!!requirement?.ano_referencia && (
                <span className="text-sm font-normal text-muted-foreground">
                  • Exercício {requirement.ano_referencia}
                </span>
              )}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Sócio(a): {requirement?.member_nome || "Carregando..."}
            </p>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Carregando informações...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Lado Esquerdo: Formulário */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Seção MTE */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  Processo MTE
                </div>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status do Fluxo</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as RequirementStatus)}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assinado">Assinado</SelectItem>
                        <SelectItem value="analise">Em Análise</SelectItem>
                        <SelectItem value="recurso_acerto">Recurso / Acerto</SelectItem>
                        <SelectItem value="deferido">Deferido</SelectItem>
                        <SelectItem value="indeferido">Indeferido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="num_mte">Número Protocolo MTE</Label>
                    <Input 
                      id="num_mte" 
                      placeholder="Ex: 123.456.789-0"
                      value={numMte}
                      onChange={(e) => setNumMte(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seção Financeira */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                  <CreditCard className="h-4 w-4" />
                  Situação Financeira
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Benefício Recebido</Label>
                    <p className="text-xs text-muted-foreground">Confirmar se o pescador já recebeu o valor do Seguro Defeso.</p>
                  </div>
                  <Switch 
                    checked={recebido}
                    onCheckedChange={setRecebido}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Lado Direito: Histórico */}
            <div className="w-full md:w-72 bg-muted/10 border-l border-t md:border-t-0 p-0 flex flex-col">
              <div className="p-4 border-b bg-muted/20 flex items-center gap-2 font-bold text-xs uppercase text-muted-foreground">
                <History className="h-3 w-3" />
                Histórico de Eventos
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum evento registrado.</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="relative pl-4 border-l border-border/60 space-y-1">
                        <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-border" />
                        <p className="text-xs font-bold leading-none">{event.descricao}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {event.created_at ? format(new Date(event.created_at), "dd/MM/yy 'às' HH:mm") : "---"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
