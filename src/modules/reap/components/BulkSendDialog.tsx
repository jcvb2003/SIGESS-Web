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
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Loader2, Send, Users, CheckCircle2, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { reapService } from "../services/reapService";
import { reapQueryKeys } from "../queryKeys";
import { ANOS_SIMPLIFICADO, ANO_INICIAL_ANUAL, ANO_ATUAL } from "../types/reap.types";
import { handleExternalLogin } from "@/shared/utils/browserDetection";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

// URL de entrada do sistema REAP (GOV.BR — ponto único de login)
const REAP_ANUAL_URL = "https://servicos.acesso.gov.br/";

const MAX_SOCIOS = 5;

interface SocioSelecionado {
  cpf: string;
  nome: string;
  senhagov: string;
  anosSimplificadoPendentes: number[];
  anosAnualPendentes: number[];
}

interface ConfirmacaoItem {
  cpf: string;
  tipo: "simplificado" | "anual";
  ano: number;
  checked: boolean;
}

interface BulkSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkSendDialog({ open, onOpenChange }: Readonly<BulkSendDialogProps>) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<SocioSelecionado[]>([]);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [confirmacoes, setConfirmacoes] = useState<ConfirmacaoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: resultados, isLoading: buscando } = useQuery({
    queryKey: ["reap-busca-socio", busca],
    queryFn: async () => {
      if (busca.length < 2) return [];
      const { data } = await supabase
        .from("socios")
        .select(`cpf, nome, senhagov_inss, emissao_rgp, reap ( simplificado, anual )`)
        .or(`nome.ilike.%${busca}%,cpf.ilike.%${busca}%`)
        .limit(10);
      return data ?? [];
    },
    enabled: busca.length >= 2,
  });

  const handleAddSocio = useCallback(
    (socio: NonNullable<typeof resultados>[0]) => {
      if (!socio.cpf) return;
      if (selecionados.length >= MAX_SOCIOS) return;
      if (selecionados.some((s) => s.cpf === socio.cpf)) return;

      const reap = Array.isArray(socio.reap) ? socio.reap[0] : socio.reap;
      const simplificadoRegistrado = (reap?.simplificado as Record<string, { enviado: boolean }>) ?? {};
      const anualRegistrado = (reap?.anual as Record<string, { enviado: boolean }>) ?? {};

      const anoRgp = socio.emissao_rgp ? new Date(socio.emissao_rgp).getFullYear() : null;
      const anosSimplificadoPendentes = ANOS_SIMPLIFICADO.filter((ano) => {
        if (anoRgp && ano < anoRgp) return false;
        return !simplificadoRegistrado[String(ano)]?.enviado;
      });

      const anosAnualPendentes: number[] = [];
      const anoInicioAnual = anoRgp ? Math.max(anoRgp, ANO_INICIAL_ANUAL) : ANO_INICIAL_ANUAL;
      for (let a = anoInicioAnual; a <= ANO_ATUAL - 1; a++) {
        if (!anualRegistrado[String(a)]?.enviado) anosAnualPendentes.push(a);
      }

      setSelecionados((prev) => [
        ...prev,
        {
          cpf: socio.cpf!,
          nome: socio.nome ?? socio.cpf ?? "",
          senhagov: (socio as Record<string, unknown>).senhagov_inss as string ?? "",
          anosSimplificadoPendentes,
          anosAnualPendentes,
        },
      ]);
      setBusca("");
    },
    [selecionados]
  );

  const handleRemoveSocio = useCallback((cpf: string) => {
    setSelecionados((prev) => prev.filter((s) => s.cpf !== cpf));
  }, []);

  const INTERVALO_EXTENSAO_MS = 1200;

  const handleEnviarGov = () => {
    // Um envio por sócio — o GOV.BR é o ponto de entrada único.
    // Em seguida, o operador navega para o sistema REAP correto (Simplificado ou Anual).
    const fila: Array<() => void> = selecionados
      .filter(
        (s) =>
          s.anosSimplificadoPendentes.length > 0 ||
          s.anosAnualPendentes.length > 0
      )
      .map(
        (s) => () =>
          handleExternalLogin(REAP_ANUAL_URL, s.cpf, s.senhagov, s.nome)
      );

    // Dispara uma chamada por vez, aguardando o intervalo para que a extensão
    // processe cada mensagem antes de receber a próxima.
    fila.forEach((fn, i) => {
      setTimeout(fn, i * INTERVALO_EXTENSAO_MS);
    });

    toast.success(
      `${fila.length} sócio(s) agendado(s) — a extensão receberá um a cada ${INTERVALO_EXTENSAO_MS / 1000}s.`
    );

    // Monta checklist de confirmação
    const items: ConfirmacaoItem[] = [];
    selecionados.forEach((s) => {
      s.anosSimplificadoPendentes.forEach((ano) => {
        items.push({ cpf: s.cpf, tipo: "simplificado", ano, checked: false });
      });
      s.anosAnualPendentes.forEach((ano) => {
        items.push({ cpf: s.cpf, tipo: "anual", ano, checked: false });
      });
    });
    setConfirmacoes(items);
    setStep("confirm");
  };

  const handleToggleConfirmacao = useCallback((index: number, checked: boolean) => {
    setConfirmacoes((prev) => prev.map((c, i) => (i === index ? { ...c, checked } : c)));
  }, []);

  const handleConfirmar = async () => {
    const marcados = confirmacoes.filter((c) => c.checked);
    if (marcados.length === 0) {
      toast.error("Nenhum REAP marcado para confirmar.");
      return;
    }

    setIsSaving(true);
    try {
      // Agrupa por sócio e tipo
      const entries = selecionados.map((s) => ({
        cpf: s.cpf,
        tipo: "simplificado" as const,
        anos: marcados
          .filter((c) => c.cpf === s.cpf && c.tipo === "simplificado")
          .map((c) => c.ano),
      })).filter((e) => e.anos.length > 0);

      const entriesAnual = selecionados.map((s) => ({
        cpf: s.cpf,
        tipo: "anual" as const,
        anos: marcados
          .filter((c) => c.cpf === s.cpf && c.tipo === "anual")
          .map((c) => c.ano),
      })).filter((e) => e.anos.length > 0);

      await reapService.batchMarkSent([...entries, ...entriesAnual]);
      toast.success(`${marcados.length} REAP(s) confirmado(s) com sucesso.`);
      queryClient.invalidateQueries({ queryKey: reapQueryKeys.all });
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
      <DialogContent className={cn("transition-all duration-300", step === "confirm" ? "max-w-2xl" : "max-w-lg")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {step === "select" ? "Envio em Lote via GOV.BR" : "Confirmar REAPs Enviados"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? `Selecione até ${MAX_SOCIOS} sócios para enviar via extensão GOV.BR.`
              : "Marque apenas os REAPs que foram efetivamente concluídos no sistema do governo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {step === "select" && (
            <>
              {/* Busca */}
              <div className="relative">
                <Input
                  placeholder="Buscar sócio por nome ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  disabled={selecionados.length >= MAX_SOCIOS}
                  id="bulk-send-search"
                />
                {buscando && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Resultados da busca */}
              {resultados && resultados.length > 0 && busca.length >= 2 && (
                <div className="border rounded-md divide-y bg-popover shadow-md max-h-48 overflow-y-auto">
                  {resultados.map((r) => {
                    const jaSelecionado = selecionados.some((s) => s.cpf === r.cpf);
                    const limiteAtingido = selecionados.length >= MAX_SOCIOS;
                    return (
                      <button
                        key={r.cpf}
                        type="button"
                        onClick={() => handleAddSocio(r)}
                        disabled={jaSelecionado || limiteAtingido}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                          (jaSelecionado || limiteAtingido) && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <p className="font-medium">{r.nome}</p>
                        <p className="text-xs text-muted-foreground">{r.cpf}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selecionados */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Selecionados ({selecionados.length}/{MAX_SOCIOS})
                  </Label>
                </div>

                {selecionados.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum sócio selecionado.
                  </p>
                ) : (
                  <div className="divide-y border rounded-md">
                    {selecionados.map((s) => (
                      <div key={s.cpf} className="flex items-start justify-between px-3 py-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">{s.nome}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.anosSimplificadoPendentes.map((ano) => (
                              <Badge key={`s-${ano}`} variant="outline" className="text-[10px]">
                                Simpl. {ano}
                              </Badge>
                            ))}
                            {s.anosAnualPendentes.map((ano) => (
                              <Badge key={`a-${ano}`} variant="outline" className="text-[10px] border-primary/40 text-primary">
                                REAP {ano}
                              </Badge>
                            ))}
                            {s.anosSimplificadoPendentes.length === 0 && s.anosAnualPendentes.length === 0 && (
                              <span className="text-xs text-muted-foreground">Sem pendências</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleRemoveSocio(s.cpf)}
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
            <ScrollArea className="h-72 border rounded-md">
              <div className="divide-y">
                {selecionados.map((s) => {
                  const itens = confirmacoes.filter((c) => c.cpf === s.cpf);
                  if (itens.length === 0) return null;
                  return (
                    <div key={s.cpf} className="px-4 py-3 space-y-2">
                      <p className="font-medium text-sm">{s.nome}</p>
                      {itens.map((item) => {
                        const globalIdx = confirmacoes.indexOf(item);
                        return (
                          <div key={`${item.tipo}-${item.ano}`} className="flex items-center gap-2 pl-2">
                            <Checkbox
                              id={`conf-${globalIdx}`}
                              checked={item.checked}
                              onCheckedChange={(checked) =>
                                handleToggleConfirmacao(globalIdx, !!checked)
                              }
                            />
                            <Label htmlFor={`conf-${globalIdx}`} className="font-normal text-sm cursor-pointer">
                              {item.tipo === "simplificado" ? `Simplificado ${item.ano}` : `REAP ${item.ano}`}
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
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>

          {step === "select" && (
            <Button
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
              onClick={handleConfirmar}
              disabled={isSaving || confirmacoes.filter((c) => c.checked).length === 0}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar {confirmacoes.filter((c) => c.checked).length} REAP(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
