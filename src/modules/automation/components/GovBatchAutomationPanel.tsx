import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  enqueueGovBatchSessions,
  getGovBatchStatuses,
  type GovBatchStatus,
  type GovBatchStatusItem,
  type GovBatchSessionItem,
} from "@/shared/utils/browserDetection";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  govBatchAutomationService,
  type GovBatchSearchResult,
} from "@/modules/automation/services/reapBulkAutomationService";

const GOV_LOGIN_URL = "https://servicos.acesso.gov.br/";
const MAX_SOCIOS = 5;

type SocioSelecionado = {
  cpf: string;
  nome: string;
  senhagov: string;
  anosSimplificadoPendentes: number[];
  anosAnualPendentes: number[];
};

export function GovBatchAutomationPanel() {
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<SocioSelecionado[]>([]);
  const [statusTrackingActive, setStatusTrackingActive] = useState(false);
  const [trackedCpfs, setTrackedCpfs] = useState<string[]>([]);
  const buscaDebounced = useDebounce(busca, 200);

  const { data: resultados, isLoading: buscando } = useQuery({
    queryKey: ["automation", "gov-busca-socio", buscaDebounced],
    queryFn: () => govBatchAutomationService.searchMembers(buscaDebounced),
    enabled: buscaDebounced.length >= 2,
  });

  const { data: statusResponse } = useQuery({
    queryKey: ["automation", "gov-batch-status", trackedCpfs],
    queryFn: () => getGovBatchStatuses(trackedCpfs),
    enabled: statusTrackingActive && trackedCpfs.length > 0,
    refetchInterval: 4000,
  });

  const statusByCpf = useMemo(() => {
    const map = new Map<string, GovBatchStatusItem>();
    for (const item of statusResponse?.items ?? []) {
      map.set(item.cpf.replace(/\D/g, ""), item);
    }
    return map;
  }, [statusResponse]);

  const handleAddSocio = useCallback(
    (socio: GovBatchSearchResult) => {
      if (!socio.cpf) return;
      if (selecionados.length >= MAX_SOCIOS) return;
      if (selecionados.some((item) => item.cpf === socio.cpf)) return;

      const cpf = socio.cpf;
      const nome = socio.nome ?? cpf;
      const { anosSimplificadoPendentes, anosAnualPendentes } =
        govBatchAutomationService.getPendingYears(socio);

      setSelecionados((prev) => [
        ...prev,
        {
          cpf,
          nome,
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

  const handleReset = useCallback(() => {
    setSelecionados([]);
    setBusca("");
    setStatusTrackingActive(false);
    setTrackedCpfs([]);
  }, []);

  const handleEnviarGov = async () => {
    if (selecionados.length === 0) {
      toast.error("Nenhum socio selecionado para envio.");
      return;
    }

    const fila: GovBatchSessionItem[] = selecionados
      .filter((socio) => socio.senhagov)
      .map((socio) => ({
        cpf: socio.cpf,
        senha: socio.senhagov,
        nome: socio.nome,
        url: GOV_LOGIN_URL,
      }));

    if (fila.length === 0) {
      toast.error("Nenhum socio selecionado possui senha GOV para entrar na fila.");
      return;
    }

    const result = await enqueueGovBatchSessions(fila);
    if (!result.success) {
      toast.error(result.error ?? "Falha ao enviar a fila GOV para a extensao.");
      return;
    }

    setStatusTrackingActive(true);
    setTrackedCpfs(fila.map((item) => item.cpf.replace(/\D/g, "")));

    const opened = result.opened ?? 0;
    const queued = result.count ?? fila.length;
    toast.success(
      `${queued} socio(s) enviado(s). ${opened} sessao(oes) aberta(s) automaticamente.`,
    );
  };

  useEffect(() => {
    if (!statusTrackingActive || !statusResponse?.items?.length) return;

    const allFinished = statusResponse.items.every((item) =>
      ["concluido", "erro", "expirado", "ignorado"].includes(item.status),
    );

    if (allFinished) {
      setStatusTrackingActive(false);
    }
  }, [statusResponse, statusTrackingActive]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5 text-primary" />
          GOV em Lote
        </CardTitle>
        <CardDescription>
          Selecione ate {MAX_SOCIOS} socios para enviar via extensao GOV.BR.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="relative">
          <Input
            placeholder="Buscar socio por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            disabled={selecionados.length >= MAX_SOCIOS}
            id="automation-gov-batch-search"
          />
          {buscando && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {resultados && resultados.length > 0 && buscaDebounced.length >= 2 && (
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
            <span className="text-xs text-muted-foreground">
              Prontos para fila: {selecionados.length}
            </span>
          </div>

          {selecionados.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum socio selecionado.
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {selecionados.map((socio) => (
                <div key={socio.cpf} className="flex items-start justify-between gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{socio.nome}</p>
                    {renderGovStatus(statusByCpf.get(socio.cpf.replace(/\D/g, "")))}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {socio.anosSimplificadoPendentes.map((ano) => (
                          <span
                            key={`s-${socio.cpf}-${ano}`}
                            className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            Simpl. {ano}
                          </span>
                        ))}
                        {socio.anosAnualPendentes.map((ano) => (
                          <span
                            key={`a-${socio.cpf}-${ano}`}
                            className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary"
                          >
                            REAP {ano}
                          </span>
                        ))}
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

        <div className="flex flex-wrap justify-end gap-3">
          {selecionados.length > 0 && (
            <Button type="button" variant="outline" onClick={handleReset}>
              Limpar
            </Button>
          )}

          <Button
            type="button"
            onClick={handleEnviarGov}
            disabled={selecionados.length === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar via GOV.BR ({selecionados.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function renderGovStatus(statusItem?: GovBatchStatusItem) {
  if (!statusItem) {
    return (
      <div className="mt-1 space-y-1.5">
        <GovBatchTrack />
        <p className="text-xs text-muted-foreground">
          Aguardando envio para a extensao
        </p>
      </div>
    );
  }

  if (statusItem.status === "aguardando_pagina" && !statusItem.lastError) {
    return null;
  }

  return (
    <div className="mt-1 space-y-1.5">
      <GovBatchTrack statusItem={statusItem} />
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.14em]",
          statusTextClassName(statusItem.status),
        )}>
          {resolveStatusHeading(statusItem)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {statusItem.statusDescription || "A extensao atualizou o progresso desta sessao."}
      </p>
      {statusItem.status === "erro" && statusItem.lastError && (
        <p className="text-xs text-destructive">{statusItem.lastError}</p>
      )}
    </div>
  );
}

function GovBatchTrack({ statusItem }: { statusItem?: GovBatchStatusItem }) {
  const totalSteps = getStatusStepTotal(statusItem);
  const currentStep = getStatusStepIndex(statusItem, totalSteps);
  const status = statusItem?.status;

  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const filled = index < currentStep;
        const errored = status === "erro" && index === currentStep - 1;

        return (
          <span
            key={`gov-track-${index}`}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              filled ? "bg-primary" : "bg-muted",
              errored && "bg-destructive",
            )}
          />
        );
      })}
    </div>
  );
}

function resolveStatusHeading(statusItem: GovBatchStatusItem): string {
  return (
    statusItem.statusTitle ||
    statusItem.statusDescription ||
    statusLabel(statusItem.status)
  );
}

function statusLabel(status: GovBatchStatus): string {
  switch (status) {
    case "enfileirado":
      return "Enfileirado";
    case "abrindo_sessao":
      return "Abrindo sessao";
    case "aguardando_pagina":
      return "Aguardando pagina";
    case "processando":
      return "Processando";
    case "concluido":
      return "Concluido";
    case "erro":
      return "Erro";
    case "expirado":
      return "Expirado";
    case "ignorado":
      return "Ignorado";
    default:
      return status;
  }
}

function statusTextClassName(status: GovBatchStatus): string {
  switch (status) {
    case "concluido":
      return "text-emerald-700";
    case "erro":
      return "text-red-700";
    case "processando":
      return "text-blue-700";
    case "abrindo_sessao":
      return "text-amber-700";
    case "aguardando_pagina":
      return "text-orange-700";
    default:
      return "text-muted-foreground";
  }
}

function getStatusStepIndex(
  statusItem?: GovBatchStatusItem,
  fallbackTotal = 3,
): number {
  if (!statusItem) {
    return 0;
  }

  const explicitStep = Number(statusItem.progressStep);
  const explicitTotal = getStatusStepTotal(statusItem) || fallbackTotal;
  if (Number.isFinite(explicitStep) && explicitStep > 0) {
    return Math.max(0, Math.min(explicitTotal, explicitStep));
  }

  const status = statusItem.status;
  const title = normalizeStepText(statusItem.statusTitle);
  const description = normalizeStepText(statusItem.statusDescription);
  const stepText = `${title} ${description}`.trim();

  if (status === "concluido" || hasAnyTerm(stepText, ["pdf baixado", "baixado com sucesso"])) {
    return 3;
  }

  if (
    hasAnyTerm(stepText, [
      "baixando pdf da guia",
      "solicitando pdf da guia",
      "retornando para a competencia",
      "pdf baixado com sucesso",
    ])
  ) {
    return 2;
  }

  if (
    hasAnyTerm(stepText, [
      "login gov.br concluido",
      "iniciando geracao da guia",
      "carregando dados de comercializacao",
      "salvando rascunho da comercializacao",
      "enviando eventos da comercializacao",
      "verificando acesso ao fechamento",
    ])
  ) {
    return 2;
  }

  if (
    hasAnyTerm(stepText, [
      "pagina inicial do esocial carregada",
      "redirecionado para o gov.br",
      "tela de cpf carregada",
      "cpf enviado ao gov.br",
      "tela de senha carregada",
      "aguardando pagina de login do esocial",
      "aguardando tela valida do gov.br",
      "carregando tela de fechamento",
      "fechando a folha",
    ])
  ) {
    return 1;
  }

  if (
    status === "aguardando_pagina" ||
    hasAnyTerm(stepText, [
      "aguardando pagina",
    ])
  ) {
    return 1;
  }

  if (status === "enfileirado" || status === "abrindo_sessao" || status === "ignorado") {
    return 1;
  }

  if (status === "erro" || status === "expirado") {
    return 1;
  }

  return 0;
}

function getStatusStepTotal(statusItem?: GovBatchStatusItem): number {
  const explicitTotal = Number(statusItem?.progressTotal);
  if (Number.isFinite(explicitTotal) && explicitTotal > 0) {
    return explicitTotal;
  }

  return 3;
}

function normalizeStepText(value?: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAnyTerm(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}
