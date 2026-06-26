import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Users, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { handleExternalLogin } from "@/shared/utils/browserDetection";
import { cn } from "@/shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  reapBulkAutomationService,
  type BulkAutomationSearchResult,
} from "@/modules/automation/services/reapBulkAutomationService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

const REAP_ANUAL_URL = "https://servicos.acesso.gov.br/";
const MAX_SOCIOS = 5;
const INTERVALO_EXTENSAO_MS = 1200;
const REAP_QUERY_KEY = ["reap"] as const;

type SocioSelecionado = {
  cpf: string;
  nome: string;
  senhagov: string;
  anosSimplificadoPendentes: number[];
  anosAnualPendentes: number[];
};

type ConfirmacaoItem = {
  cpf: string;
  tipo: "simplificado" | "anual";
  ano: number;
  checked: boolean;
};

interface ReapBulkSendAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReapBulkSendAutomationDialog({
  open,
  onOpenChange,
}: Readonly<ReapBulkSendAutomationDialogProps>) {
  const queryClient = useQueryClient();
  const { tenantId } = useActiveScope();
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<SocioSelecionado[]>([]);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [confirmacoes, setConfirmacoes] = useState<ConfirmacaoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const buscaDebounced = useDebounce(busca, 200);

  const { data: resultados, isLoading: buscando } = useQuery({
    queryKey: ["automation", "reap-busca-socio", buscaDebounced],
    queryFn: () => reapBulkAutomationService.searchMembers(buscaDebounced),
    enabled: buscaDebounced.length >= 2,
  });

  const handleAddSocio = useCallback(
    (socio: BulkAutomationSearchResult) => {
      if (!socio.cpf) return;
      if (selecionados.length >= MAX_SOCIOS) return;
      if (selecionados.some((item) => item.cpf === socio.cpf)) return;

      const { anosSimplificadoPendentes, anosAnualPendentes } =
        reapBulkAutomationService.getPendingYears(socio);

      setSelecionados((prev) => [
        ...prev,
        {
          cpf: socio.cpf!,
          nome: socio.nome ?? socio.cpf ?? "",
          senhagov: socio.senhagov_inss ?? "",
          anosSimplificadoPendentes,
          anosAnualPendentes,
        },
      ]);
      setBusca("");
    },
    [selecionados],
  );

  const handleRemoveSocio = useCallback((cpf: string) => {
    setSelecionados((prev) => prev.filter((item) => item.cpf !== cpf));
  }, []);

  const handleEnviarGov = () => {
    const fila = selecionados
      .filter(
        (socio) =>
          socio.anosSimplificadoPendentes.length > 0 ||
          socio.anosAnualPendentes.length > 0,
      )
      .map(
        (socio) => () =>
          handleExternalLogin(REAP_ANUAL_URL, socio.cpf, socio.senhagov, socio.nome),
      );

    fila.forEach((fn, index) => {
      setTimeout(fn, index * INTERVALO_EXTENSAO_MS);
    });

    toast.success(
      `${fila.length} sócio(s) agendado(s).`,
    );

    const items: ConfirmacaoItem[] = [];
    selecionados.forEach((socio) => {
      socio.anosSimplificadoPendentes.forEach((ano) => {
        items.push({ cpf: socio.cpf, tipo: "simplificado", ano, checked: false });
      });
      socio.anosAnualPendentes.forEach((ano) => {
        items.push({ cpf: socio.cpf, tipo: "anual", ano, checked: false });
      });
    });

    setConfirmacoes(items);
    setStep("confirm");
  };

  const handleToggleConfirmacao = useCallback((index: number, checked: boolean) => {
    setConfirmacoes((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, checked } : item,
      ),
    );
  }, []);

  const handleConfirmar = async () => {
    const marcados = confirmacoes.filter((item) => item.checked);
    if (marcados.length === 0) {
      toast.error("Nenhum REAP marcado para confirmar.");
      return;
    }

    setIsSaving(true);
    try {
      const entries = selecionados
        .map((socio) => ({
          cpf: socio.cpf,
          tipo: "simplificado" as const,
          anos: marcados
            .filter((item) => item.cpf === socio.cpf && item.tipo === "simplificado")
            .map((item) => item.ano),
        }))
        .filter((entry) => entry.anos.length > 0);

      const entriesAnual = selecionados
        .map((socio) => ({
          cpf: socio.cpf,
          tipo: "anual" as const,
          anos: marcados
            .filter((item) => item.cpf === socio.cpf && item.tipo === "anual")
            .map((item) => item.ano),
        }))
        .filter((entry) => entry.anos.length > 0);

      await reapBulkAutomationService.batchMarkSent([...entries, ...entriesAnual], tenantId);
      toast.success(`${marcados.length} REAP(s) confirmado(s) com sucesso.`);
      queryClient.invalidateQueries({ queryKey: REAP_QUERY_KEY });
      handleClose();
    } catch {
      toast.error("Erro ao confirmar REAPs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelecionados([]);
    setBusca("");
    setStep("select");
    setConfirmacoes([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300",
          step === "confirm" ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {step === "select"
              ? "Envio em Lote via GOV.BR"
              : "Confirmar REAPs Enviados"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? `Selecione até ${MAX_SOCIOS} sócios para enviar via extensão GOV.BR.`
              : "Marque apenas os REAPs que foram efetivamente concluídos no sistema do governo."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {step === "select" && (
            <>
              <div className="relative">
                <Input
                  placeholder="Buscar sócio por nome ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  disabled={selecionados.length >= MAX_SOCIOS}
                  id="automation-bulk-send-search"
                />
                {buscando && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {resultados && resultados.length > 0 && busca.length >= 2 && (
                <div className="max-h-48 divide-y overflow-y-auto rounded-md border bg-popover shadow-md">
                  {resultados.map((resultado) => {
                    const jaSelecionado = selecionados.some(
                      (item) => item.cpf === resultado.cpf,
                    );
                    const limiteAtingido = selecionados.length >= MAX_SOCIOS;

                    return (
                      <button
                        key={resultado.cpf}
                        type="button"
                        onClick={() => handleAddSocio(resultado)}
                        disabled={jaSelecionado || limiteAtingido}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                          (jaSelecionado || limiteAtingido) &&
                            "cursor-not-allowed opacity-40",
                        )}
                      >
                        <p className="font-medium">{resultado.nome}</p>
                        <p className="text-xs text-muted-foreground">{resultado.cpf}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Selecionados ({selecionados.length}/{MAX_SOCIOS})
                  </Label>
                </div>

                {selecionados.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum sócio selecionado.
                  </p>
                ) : (
                  <div className="divide-y rounded-md border">
                    {selecionados.map((socio) => (
                      <div
                        key={socio.cpf}
                        className="flex items-start justify-between gap-2 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{socio.nome}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {socio.anosSimplificadoPendentes.map((ano) => (
                              <Badge
                                key={`s-${socio.cpf}-${ano}`}
                                variant="outline"
                                className="text-[10px]"
                              >
                                Simpl. {ano}
                              </Badge>
                            ))}
                            {socio.anosAnualPendentes.map((ano) => (
                              <Badge
                                key={`a-${socio.cpf}-${ano}`}
                                variant="outline"
                                className="border-primary/40 text-[10px] text-primary"
                              >
                                REAP {ano}
                              </Badge>
                            ))}
                            {socio.anosSimplificadoPendentes.length === 0 &&
                              socio.anosAnualPendentes.length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Sem pendências
                                </span>
                              )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleRemoveSocio(socio.cpf)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === "confirm" && (
            <ScrollArea className="h-72 rounded-md border">
              <div className="divide-y">
                {selecionados.map((socio) => {
                  const itens = confirmacoes.filter((item) => item.cpf === socio.cpf);
                  if (itens.length === 0) return null;

                  return (
                    <div key={socio.cpf} className="space-y-2 px-4 py-3">
                      <p className="text-sm font-medium">{socio.nome}</p>
                      {itens.map((item) => {
                        const globalIdx = confirmacoes.indexOf(item);
                        return (
                          <div
                            key={`${item.tipo}-${item.ano}`}
                            className="flex items-center gap-2 pl-2"
                          >
                            <Checkbox
                              id={`automation-conf-${globalIdx}`}
                              checked={item.checked}
                              onCheckedChange={(checked) =>
                                handleToggleConfirmacao(globalIdx, !!checked)
                              }
                            />
                            <Label
                              htmlFor={`automation-conf-${globalIdx}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {item.tipo === "simplificado"
                                ? `Simplificado ${item.ano}`
                                : `REAP ${item.ano}`}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>

          {step === "select" && (
            <Button
              type="button"
              onClick={handleEnviarGov}
              disabled={selecionados.length === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar via GOV.BR ({selecionados.length})
            </Button>
          )}

          {step === "confirm" && (
            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={
                isSaving || confirmacoes.filter((item) => item.checked).length === 0
              }
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar {confirmacoes.filter((item) => item.checked).length} REAP(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

