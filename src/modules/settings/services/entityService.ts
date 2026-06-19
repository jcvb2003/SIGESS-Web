import { supabase } from "@/shared/lib/supabase/client";
import { BRANDING_COLORS } from "../constants/brandingDefaults";
import { getAdminClient } from "@/shared/lib/supabase/admin-client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { UnitReadScope, UnitWriteScope } from "@/shared/types/scope";
import { TENANT_CONFIG_CACHE_KEY } from "@/config/tenants";
import {
  EntitySettings,
  defaultEntitySettings,
} from "../types/settings.types";
import {
  toStringValue,
  toNullable,
  toOptional,
  normalizeUf,
} from "../utils/settingsHelpers";

const ENTITY_TABLE = "entidade";
const CONFIG_TABLE = "configuracao_entidade";
export const BRANDING_BUCKET = "branding";

async function getTenantIdentity(): Promise<{ name: string; shortName: string; logoUrl?: string } | null> {
  const cached = localStorage.getItem(TENANT_CONFIG_CACHE_KEY);
  const tenantCode = cached ? (JSON.parse(cached) as { code?: string }).code : null;
  if (!tenantCode) return null;

  const adminClient = getAdminClient();
  if (!adminClient) return null;

  const { data, error } = await adminClient
    .from("tenant_identity_public")
    .select("name, short_name, logo_url")
    .eq("tenant_code", tenantCode)
    .maybeSingle();

  if (error || !data) return null;
  const d = data as { name: string; short_name?: string | null; logo_url?: string | null };
  return {
    name: d.name,
    shortName: d.short_name ?? d.name,
    logoUrl: d.logo_url ?? undefined,
  };
}

async function getEntity(scope: UnitReadScope): Promise<ServiceResponse<EntitySettings>> {
  let entityQuery = supabase.from(ENTITY_TABLE).select("*").limit(1);
  if (scope.tenantId) entityQuery = entityQuery.eq("tenant_id", scope.tenantId);
  if (scope.unitId) entityQuery = entityQuery.eq("unit_id", scope.unitId);
  const { data: entityData, error: entityError } = await entityQuery.maybeSingle();

  if (entityError) {
    console.error("Erro ao buscar entidade:", entityError);
    return { data: null, error: entityError };
  }

  let configQuery = supabase.from(CONFIG_TABLE).select("*").limit(1);
  if (scope.tenantId) configQuery = configQuery.eq("tenant_id", scope.tenantId);
  if (scope.unitId) configQuery = configQuery.eq("unit_id", scope.unitId);
  const { data: configData, error: configError } = await configQuery.maybeSingle();

  if (configError) {
    console.error("Erro ao buscar configurações da entidade:", configError);
    return { data: null, error: configError };
  }

  if (!entityData) {
    return { data: { ...defaultEntitySettings }, error: null };
  }

  let logoUrl: string | undefined = undefined;
  if (configData?.logo_path) {
    const { data: publicUrlData } = supabase.storage
      .from(BRANDING_BUCKET)
      .getPublicUrl(configData.logo_path);
    logoUrl = publicUrlData.publicUrl;
  }

  return {
    data: {
      id: entityData.id ? String(entityData.id) : undefined,
      unitId: (entityData as Record<string, unknown>).unit_id as string | null ?? null,
      name: toStringValue(entityData.nome_entidade),
      shortName: toStringValue(entityData.nome_abreviado),
      cnpj: toStringValue(entityData.cnpj),
      street: toStringValue(entityData.endereco),
      district: toStringValue(entityData.bairro),
      city: toStringValue(entityData.cidade),
      state: normalizeUf(entityData.uf),
      cep: toStringValue(entityData.cep),
      phone1: toStringValue(entityData.fone),
      phone2: toStringValue(entityData.celular),
      email: toStringValue(entityData.email),
      federation: toStringValue(entityData.federacao),
      confederation: toStringValue(entityData.confederacao),
      pole: toStringValue(entityData.polo),
      foundation: toStringValue(entityData.fundacao),
      county: toStringValue(entityData.comarca),
      number: toStringValue(entityData.numero),
      presidentName: toStringValue(entityData.nome_do_presidente),
      presidentCpf: toStringValue(entityData.cpf_do_presidente),
      corPrimaria: toStringValue(configData?.cor_primaria, BRANDING_COLORS.primary),
      corSecundaria: toStringValue(configData?.cor_secundaria, BRANDING_COLORS.secondary),
      corSidebar: toStringValue(configData?.cor_sidebar, BRANDING_COLORS.primary),
      logoPath: configData?.logo_path ? String(configData.logo_path) : undefined,
      logoUrl: logoUrl,
    },
    error: null,
  };
}

async function updateEntitySettings(
  settings: EntitySettings,
  scope: UnitWriteScope,
): Promise<ServiceResponse<EntitySettings>> {
  let entityId = settings.id;
  if (!entityId) {
    let currentEntityQuery = supabase.from(ENTITY_TABLE).select("id").limit(1);
    currentEntityQuery = currentEntityQuery.eq("tenant_id", scope.tenantId);
    if (scope.unitId) currentEntityQuery = currentEntityQuery.eq("unit_id", scope.unitId);
    const { data: currentEntity } = await currentEntityQuery.maybeSingle();
    entityId = currentEntity?.id ? String(currentEntity.id) : undefined;
  }
  const { error: entityError } = await supabase
    .from(ENTITY_TABLE)
    .upsert({
      id: entityId,
      unit_id: scope.unitId,
      tenant_id: scope.tenantId,
      nome_entidade: toNullable(settings.name),
      nome_abreviado: toNullable(settings.shortName),
      cnpj: toNullable(settings.cnpj),
      endereco: toNullable(settings.street),
      numero: toNullable(settings.number),
      bairro: toNullable(settings.district),
      cidade: toNullable(settings.city),
      uf: toNullable(normalizeUf(settings.state)),
      cep: toNullable(settings.cep),
      fone: toNullable(settings.phone1),
      celular: toNullable(settings.phone2),
      email: toNullable(settings.email),
      federacao: toNullable(settings.federation),
      confederacao: toNullable(settings.confederation),
      polo: toNullable(settings.pole),
      fundacao: toNullable(settings.foundation),
      comarca: toNullable(settings.county),
      nome_do_presidente: toNullable(settings.presidentName),
      cpf_do_presidente: toNullable(settings.presidentCpf),
    });

  if (entityError) {
    console.error("Erro ao salvar entidade:", entityError);
    return { data: null, error: entityError };
  }

  let currentConfigQuery = supabase.from(CONFIG_TABLE).select("id").limit(1);
  currentConfigQuery = currentConfigQuery.eq("tenant_id", scope.tenantId);
  if (scope.unitId) currentConfigQuery = currentConfigQuery.eq("unit_id", scope.unitId);
  const { data: currentConfig } = await currentConfigQuery.maybeSingle();

  const { error: configError } = await supabase
    .from(CONFIG_TABLE)
    .upsert({
      id: currentConfig?.id,
      unit_id: scope.unitId,
      tenant_id: scope.tenantId,
      cor_primaria: toOptional(settings.corPrimaria),
      cor_secundaria: toOptional(settings.corSecundaria),
      cor_sidebar: toOptional(settings.corSidebar),
      logo_path: toNullable(settings.logoPath),
    });

  if (configError) {
    console.error("Erro ao salvar configurações visuais:", configError);
    return { data: null, error: configError };
  }

  return getEntity(scope);
}

export const entityService = { getTenantIdentity, getEntity, updateEntitySettings };
