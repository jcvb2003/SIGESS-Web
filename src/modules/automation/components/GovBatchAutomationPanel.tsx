import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, Users } from "lucide-react";
import { toast } from "sonner";
import {
  enqueueGovBatchSessions,
  getESocialAutomationSettings,
  getGovBatchStatuses,
  subscribeToESocialAutomationSettings,
  type ESocialAutomationSettingsSnapshot,
  type GovBatchSessionItem,
} from "@/shared/utils/browserDetection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  formatGpsCurrencyInput,
  getStoredGpsCurrencyValue,
  hasGpsCurrencyValue,
  normalizeGpsCurrencyValue,
  setStoredGpsCurrencyValue,
} from "@/shared/utils/gpsValue";
import {
  govBatchAutomationService,
  type GovBatchSearchResult,
} from "@/modules/automation/services/reapBulkAutomationService";
import { GpsConfigurationCard } from "./GpsConfigurationCard";
import { SocioSearchResults } from "./SocioSearchResults";
import { SocioListItem } from "./SocioListItem";
import type { SocioSelecionado } from "./govBatch.types";

const GOV_LOGIN_URL = "https://servicos.acesso.gov.br/";
const MAX_SOCIOS = 5;

export function GovBatchAutomationPanel() {
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<SocioSelecionado[]>([]);
  const [statusTrackingActive, setStatusTrackingActive] = useState(false);
  const [trackedCpfs, setTrackedCpfs] = useState<string[]>([]);
  const [valorComercializado, setValorComercializado] = useState(() =>
    getStoredGpsCurrencyValue(),
  );
  const [extensionSettings, setExtensionSettings] =
    useState<ESocialAutomationSettingsSnapshot | null>(null);
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
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
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
    const map = new Map();
    for (const item of statusResponse?.items ?? []) {
      map.set(item.cpf.replace(/\D/g, ""), item);
    }
    return map;
  }, [statusResponse]);

  useEffect(() => {
    if (esocialSettingsResponse?.success && esocialSettingsResponse.data) {
      setExtensionSettings(esocialSettingsResponse.data);
    }
  }, [esocialSettingsResponse]);

  useEffect(() => {
    return subscribeToESocialAutomationSettings((settings) => {
      setExtensionSettings(settings);
    });
  }, []);

  const esocialSettings = useMemo(() => {
    const settings = extensionSettings;
    if ((!esocialSettingsResponse || !esocialSettingsResponse.success) && !settings) {
      return {
        enabled: false,
        competencia: "Indisponível",
        valor: "",
        message: "Não foi possível ler a configuração da extensão.",
      };
    }

    if (!settings) {
      return {
        enabled: false,
        competencia: "Indisponível",
        valor: "",
        message: "Carregando configuração da extensão...",
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

    return {
      enabled: true,
      competencia: settings.competencia || "Sem competência",
      valor: valorComercializado,
      message: "",
    };
  }, [esocialSettingsResponse, extensionSettings, valorComercializado]);

  const handleValorComercializadoChange = useCallback((value: string) => {
    const formatted = formatGpsCurrencyInput(value);
    setValorComercializado(formatted);
    setStoredGpsCurrencyValue(formatted);
  }, []);

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

    if (esocialSettings.enabled && !hasGpsCurrencyValue(valorComercializado)) {
      toast.error("Informe o valor comercializado antes de enviar para o eSocial.");
      return;
    }

    const valorConfigurado = normalizeGpsCurrencyValue(valorComercializado);
    const fila: GovBatchSessionItem[] = selecionados
      .filter((socio) => socio.senhagov)
      .map((socio) => ({
        cpf: socio.cpf,
        senha: socio.senhagov,
        nome: socio.nome,
        url: GOV_LOGIN_URL,
        valorComercializado: esocialSettings.enabled ? valorConfigurado : undefined,
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
      ["concluido", "boleto_salvo", "erro", "expirado", "ignorado"].includes(
        item.status,
      ),
    );

    if (allFinished) {
      setStatusTrackingActive(false);
    }
  }, [statusResponse, statusTrackingActive]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] lg:grid-rows-[auto_auto] lg:items-start">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-primary" />
              GOV em Lote
            </CardTitle>
            <CardDescription>
              Selecione até {MAX_SOCIOS} sócios para enviar via extensão GOV.BR.
            </CardDescription>
          </div>

          <div className="w-full lg:row-span-2 lg:w-auto lg:justify-self-end">
            <GpsConfigurationCard
              {...esocialSettings}
              valor={valorComercializado}
              onValorChange={handleValorComercializadoChange}
            />
          </div>

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
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {resultados && resultados.length > 0 && buscaDebounced.length >= 2 && (
          <SocioSearchResults
            resultados={resultados}
            selectedCpfs={selecionados.map((item) => item.cpf)}
            maxSocios={MAX_SOCIOS}
            onAddSocio={handleAddSocio}
          />
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
                <SocioListItem
                  key={socio.cpf}
                  socio={socio}
                  statusItem={statusByCpf.get(socio.cpf.replace(/\D/g, ""))}
                  onRemove={handleRemoveSocio}
                />
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
