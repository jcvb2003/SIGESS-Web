import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  enqueueGovBatchSessions,
  getESocialAutomationSettings,
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

  const trackedCpfsKey = useMemo(() => trackedCpfs.join(","), [trackedCpfs]);

  const { data: esocialSettingsResponse } = useQuery({
    queryKey: ["automation", "esocial-extension-settings"],
    queryFn: getESocialAutomationSettings,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: statusResponse } = useQuery({
    queryKey: ["automation", "gov-batch-status", trackedCpfsKey],
    queryFn: () => getGovBatchStatuses(trackedCpfs),
    enabled: statusTrackingActive && trackedCpfs.length > 0,
    refetchInterval: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  const statusByCpf = useMemo(() => {
    const map = new Map<string, GovBatchStatusItem>();
    for (const item of statusResponse?.items ?? []) {
      map.set(item.cpf.replace(/\D/g, ""), item);
    }
    return map;
  }, [statusResponse]);

  const esocialSettings = useMemo(() => {
    const settings = esocialSettingsResponse?.data;
    if (!esocialSettingsResponse?.success || !settings) {
      return {
        enabled: false,
        competencia: "Indisponível",
        valor: "Indisponível",
        message: "Não foi possível ler a configuração da extensão.",
      };
    }

    if (!settings.gerarGps) {
      return {
        enabled: false,
        competencia: "",
        valor: "",
        message: "Função desativada na extensão.",
      };
    }

    const competencia = settings.competencia || "Sem competência";
    const valor = formatConfiguredCurrency(settings.valorComercializado);
    return {
      enabled: true,
      competencia,
      valor: valor || "Não informado",
      message: "",
    };
  }, [esocialSettingsResponse]);

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
      toast.error("Nenhum sócio selecionado para envio.");
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
      toast.error("Nenhum sócio selecionado possui senha GOV para entrar na fila.");
      return;
    }

    const result = await enqueueGovBatchSessions(fila);
    if (!result.success) {
      toast.error(result.error ?? "Falha ao enviar a fila GOV para a extensão.");
      return;
    }

    setStatusTrackingActive(true);
    setTrackedCpfs(fila.map((item) => item.cpf.replace(/\D/g, "")));

    const opened = result.opened ?? 0;
    const queued = result.count ?? fila.length;
    toast.success(
      `${queued} sócio(s) enviado(s). ${opened} sessão(ões) aberta(s) automaticamente.`,
    );
  };

  useEffect(() => {
    if (!statusTrackingActive || !statusResponse?.items?.length) return;

    const allFinished = statusResponse.items.every((item) =>
      ["concluido", "boleto_salvo", "erro", "expirado", "ignorado"].includes(item.status),
    );

    if (allFinished) {
      setStatusTrackingActive(false);
    }
  }, [statusResponse, statusTrackingActive]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-primary" />
              GOV em Lote
            </CardTitle>
            <CardDescription>
              Selecione até {MAX_SOCIOS} sócios para enviar via extensão GOV.BR.
            </CardDescription>
          </div>

          <div className="flex min-w-[240px] max-w-[320px] flex-col gap-1 rounded-md border bg-muted/20 px-3 py-2 lg:items-end">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Configuração GPS
            </div>
            {esocialSettings.enabled ? (
              <>
                <div className="text-right text-xs text-foreground">
                  Competência: {esocialSettings.competencia}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Valor definido: {esocialSettings.valor}
                </div>
              </>
            ) : (
              <div className="text-right text-xs text-muted-foreground">
                {esocialSettings.message}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        <div className="relative">
          <Input
            placeholder="Buscar sócio por nome ou CPF..."
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
              Nenhum sócio selecionado.
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
          Aguardando envio para a extensão
        </p>
      </div>
    );
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
        {statusItem.statusDescription || "A extensão atualizou o progresso desta sessão."}
      </p>
      {renderBoletoInfo(statusItem)}
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
    case "abrindo_em_lote":
      return "Abrindo em lote";
    case "fazendo_login":
      return "Fazendo Login";
    case "acessando_esocial":
      return "Acessando o E-social";
    case "consultando":
      return "Consultando";
    case "verificando_boleto":
      return "Verificando boleto";
    case "boleto_salvo":
      return "Boleto salvo";
    case "gerando_pdf":
      return "Gerando PDF";
    case "redirecionando":
      return "Redirecionando";
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
    case "fazendo_login":
    case "consultando":
      return "text-blue-700";
    case "abrindo_em_lote":
    case "acessando_esocial":
      return "text-amber-700";
    case "verificando_boleto":
    case "boleto_salvo":
    case "gerando_pdf":
    case "redirecionando":
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

  if (status === "concluido") {
    return 3;
  }

  if (
    status === "boleto_salvo" ||
    status === "gerando_pdf" ||
    status === "redirecionando"
  ) {
    return 3;
  }

  if (
    status === "acessando_esocial" ||
    status === "consultando" ||
    status === "verificando_boleto"
  ) {
    return 2;
  }

  if (
    status === "enfileirado" ||
    status === "abrindo_em_lote" ||
    status === "fazendo_login" ||
    status === "ignorado"
  ) {
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

function formatConfiguredCurrency(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^R\$\s*/i.test(trimmed)) return trimmed;
  return `R$ ${trimmed}`;
}

function renderBoletoInfo(statusItem: GovBatchStatusItem) {
  if (!statusItem.boletoInfo) return null;

  const { detectado, competencia, valorComercializado, valorDeclarado, valorPago } = statusItem.boletoInfo;
  const formatCurrency = (value?: number) =>
    value == null
      ? null
      : value.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
  const valorComercializadoLabel = formatCurrency(valorComercializado);
  const valorDeclaradoLabel = formatCurrency(valorDeclarado);
  const valorPagoLabel = formatCurrency(valorPago);
  const valueParts = [
    valorComercializadoLabel && `Comercializado: ${valorComercializadoLabel}`,
    valorDeclaradoLabel && `Declarado: ${valorDeclaradoLabel}`,
    valorPagoLabel && `Pago: ${valorPagoLabel}`,
  ].filter(Boolean);

  if (statusItem.status === "verificando_boleto") {
    if (detectado) {
      return (
        <div className="mt-2 rounded-sm bg-blue-50 p-2 text-xs text-blue-900">
          <p className="font-medium">Boleto detectado: {competencia}</p>
          {valueParts.length > 0 && <p>{valueParts.join(" | ")}</p>}
        </div>
      );
    } else {
      return (
        <div className="mt-2 rounded-sm bg-amber-50 p-2 text-xs text-amber-900">
          <p className="font-medium">Boleto não detectado. Gerando...</p>
        </div>
      );
    }
  }

  if (statusItem.status === "boleto_salvo") {
    const tipo = statusItem.boletoGerado ? "Gerado" : "Já existia";
    return (
      <div className="mt-2 rounded-sm bg-emerald-50 p-2 text-xs text-emerald-900">
        <p className="font-medium">Boleto salvo com sucesso - {tipo}</p>
        {competencia && (
          <p>
            {competencia}
            {valueParts.length > 0 && ` | ${valueParts.join(" | ")}`}
          </p>
        )}
      </div>
    );
  }

  return null;
}

