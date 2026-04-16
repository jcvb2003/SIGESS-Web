import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";

const ADMIN_FUNCTION_URL = "https://vdwupmfpfkaempsiqfgb.supabase.co/functions/v1/manage-license";

export interface ExtensionDevice {
  fingerprint: string;
  nome: string;
}

export interface UsageDetail {
  used: number;
  max: number;
}

export interface LicenseInfo {
  ok: boolean;
  plan?: {
    manual: boolean;
    turbo: boolean;
    agro: boolean;
  };
  status?: string;
  expires_at?: string;
  devices?: ExtensionDevice[] | number;
  fingerprints?: string[];
  device_metadata?: Record<string, string>;
  max_devices?: number;
  usage_manual?: number;
  max_manual?: number;
  usage_turbo?: number;
  max_turbo?: number;
  usage_agro?: number;
  max_agro?: number;
}

export const extensionService = {
  /**
   * Busca a chave de licença salva localmente no tenant
   */
  async getLicenseKey(): Promise<string | null> {
    type FromType = {
      select: (c: string) => {
        eq: (col: string, val: number) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
        };
      };
    };

    const { data, error } = await (
      supabase as unknown as { from: (t: string) => FromType }
    )
      .from("configuracao_entidade")
      .select("extensao_license_key")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar chave da extensão:", error);
      return null;
    }

    const typedData = data as { extensao_license_key: string | null } | null;
    return typedData?.extensao_license_key || null;
  },

  /**
   * Salva a chave de licença localmente no tenant via RPC segura
   */
  async saveLicenseKey(key: string): Promise<ServiceResponse<void>> {
    const rpcClient = supabase as unknown as {
      rpc: (
        n: string,
        a: Record<string, unknown>
      ) => Promise<{ data: unknown; error: unknown }>;
    };

    const { error } = await rpcClient.rpc("update_extension_license", {
      p_key: key.trim() || null,
    });

    if (error) {
      console.error("Erro ao salvar chave da extensão:", error);
      return { data: null, error: error as Error };
    }

    return { data: undefined, error: null };
  },

  /**
   * Chama a Edge Function no projeto ADMIN para listar dispositivos ou desativar
   */
  async callAdminApi(
    action: "list_devices" | "deactivate_device",
    key: string,
    fingerprint?: string
  ): Promise<LicenseInfo> {
    try {
      const response = await fetch(ADMIN_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          action,
          fingerprint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro na comunicação com a API de licenças."
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao executar action ${action}:`, error);
      throw error;
    }
  },
};
