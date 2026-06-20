import { supabase } from "@/shared/lib/supabase/client";
import type { Tables } from "@/shared/lib/supabase/database.types";

export type CollectionConfig = Tables<"configuracao_recebimento">;

export interface CollectionConfigPublic {
  id: string;
  tenant_id: string;
  provider: string;
  ambiente: string;
  dia_vencimento: number;
  forma_padrao: string;
  envio_automatico: boolean;
  has_api_key: boolean;
  has_webhook_token: boolean;
  created_at: string;
  updated_at: string;
}

export type CollectionConfigUpdate = Partial<
  Pick<CollectionConfig, "provider" | "ambiente" | "dia_vencimento" | "forma_padrao" | "envio_automatico" | "api_key" | "webhook_token">
>;

export const collectionConfigService = {
  // Leitura segura: RPC SECURITY DEFINER (não expõe api_key/webhook_token)
  async getConfig(tenantId: string): Promise<CollectionConfigPublic | null> {
    const { data, error } = await supabase.rpc(
      "get_configuracao_recebimento_publica" as never,
      { p_tenant_id: tenantId } as never,
    );
    if (error) throw error;
    const rows = data as CollectionConfigPublic[] | null;
    return rows?.[0] ?? null;
  },

  // Escrita: presidente via RLS (operator_type = 'presidente')
  // REGRA DE SECRETS: só inclui api_key/webhook_token se foram preenchidos
  // Campo vazio = não sobrescrever o secret existente
  async upsertConfig(tenantId: string, values: CollectionConfigUpdate): Promise<void> {
    const safeValues: Record<string, unknown> = {};
    if (values.provider !== undefined) safeValues.provider = values.provider;
    if (values.ambiente !== undefined) safeValues.ambiente = values.ambiente;
    if (values.dia_vencimento !== undefined) safeValues.dia_vencimento = values.dia_vencimento;
    if (values.forma_padrao !== undefined) safeValues.forma_padrao = values.forma_padrao;
    if (values.envio_automatico !== undefined) safeValues.envio_automatico = values.envio_automatico;
    // Secrets: só incluir se não vazio
    if (values.api_key) safeValues.api_key = values.api_key;
    if (values.webhook_token) safeValues.webhook_token = values.webhook_token;

    const { error } = await supabase
      .from("configuracao_recebimento")
      .upsert({ tenant_id: tenantId, ...safeValues }, { onConflict: "tenant_id" });
    if (error) throw error;
  },
};
