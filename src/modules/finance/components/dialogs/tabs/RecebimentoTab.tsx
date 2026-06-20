import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCollectionConfig } from "../../../hooks/data/useCollectionConfig";
import { useUpdateCollectionConfig } from "../../../hooks/edit/useUpdateCollectionConfig";

interface RecebimentoForm {
  provider: string;
  ambiente: string;
  api_key: string;       // vazio = não sobrescrever
  webhook_token: string; // vazio = não sobrescrever
  forma_padrao: string;
  envio_automatico: boolean;
}

export function RecebimentoTab() {
  const { config, isLoading } = useCollectionConfig();
  const updateMutation = useUpdateCollectionConfig();

  const { register, handleSubmit, setValue, watch } = useForm<RecebimentoForm>({
    defaultValues: {
      provider: config?.provider ?? "manual",
      ambiente: config?.ambiente ?? "sandbox",
      api_key: "",           // nunca pré-preencher com valor real
      webhook_token: "",     // nunca pré-preencher com valor real
      forma_padrao: config?.forma_padrao ?? "boleto",
      envio_automatico: config?.envio_automatico ?? false,
    },
    values: config
      ? {
          provider: config.provider,
          ambiente: config.ambiente,
          api_key: "",         // sempre vazio — não exibir secret
          webhook_token: "",   // sempre vazio — não exibir secret
          forma_padrao: config.forma_padrao,
          envio_automatico: config.envio_automatico,
        }
      : undefined,
  });

  const providerWatch = watch("provider");
  const isConfigured = config?.has_api_key && config?.has_webhook_token;

  const onSubmit = (data: RecebimentoForm) => {
    updateMutation.mutate({
      provider: data.provider,
      ambiente: data.ambiente,
      forma_padrao: data.forma_padrao,
      envio_automatico: data.envio_automatico,
      // Secrets: só envia se preenchido (serviço omite se vazio)
      ...(data.api_key ? { api_key: data.api_key } : {}),
      ...(data.webhook_token ? { webhook_token: data.webhook_token } : {}),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-1">

        {/* Status summary */}
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
              <CheckCircle2 className="h-3 w-3" />
              Configurado
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20">
              <AlertTriangle className="h-3 w-3" />
              Incompleto
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {isConfigured
              ? "Integração ativa com provider externo."
              : "Configure a chave API e o token de webhook para ativar."}
          </span>
        </div>

        <div className="space-y-1.5">
          <Label>Modo de recebimento</Label>
          <Select value={providerWatch} onValueChange={(v) => setValue("provider", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual (sem provider externo)</SelectItem>
              <SelectItem value="asaas">Asaas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {providerWatch !== "manual" && (
          <>
            <div className="space-y-1.5">
              <Label>Ambiente</Label>
              <Select value={watch("ambiente")} onValueChange={(v) => setValue("ambiente", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Chave API</Label>
              <Input
                type="password"
                placeholder={config?.has_api_key ? "••••••••• (configurada)" : "Cole a chave do Asaas"}
                {...register("api_key")}
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground">
                Deixe em branco para manter a chave atual.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Token de webhook</Label>
              <Input
                type="password"
                placeholder={config?.has_webhook_token ? "••••••••• (configurado)" : "Token enviado pelo Asaas nos webhooks"}
                {...register("webhook_token")}
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground">
                Deixe em branco para manter o token atual.
              </p>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label>Forma padrão</Label>
          <Select value={watch("forma_padrao")} onValueChange={(v) => setValue("forma_padrao", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Envio automático</p>
            <p className="text-xs text-muted-foreground">Enviar cobrança imediatamente ao gerar</p>
          </div>
          <Switch
            checked={watch("envio_automatico")}
            onCheckedChange={(v) => setValue("envio_automatico", v)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" size="sm" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar configuração
          </Button>
        </div>
      </form>
    </ScrollArea>
  );
}
