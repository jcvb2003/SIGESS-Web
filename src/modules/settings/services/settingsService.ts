import { supabase } from "@/shared/lib/supabase/client";
import { BRANDING_COLORS } from "../constants/brandingDefaults";
import { getAdminClient } from "@/shared/lib/supabase/admin-client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { UnitReadScope, UnitWriteScope } from "@/shared/types/scope";
import { TENANT_CONFIG_CACHE_KEY } from "@/config/tenants";
import {
  EntitySettings,
  defaultEntitySettings,
  DocumentTemplate,
  Locality,
  Portaria,
} from "../types/settings.types";
const ENTITY_TABLE = "entidade";
const CONFIG_TABLE = "configuracao_entidade";
const DOCUMENT_TEMPLATES_TABLE = "templates";
const DOCUMENT_TEMPLATES_BUCKET = "documentos";
export const BRANDING_BUCKET = "branding";
const LOCALITIES_TABLE = "localidades";
const PORTARIAS_TABLE = "portarias";
const toStringValue = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return fallback;
};

const toNullable = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  return trimmed || null;
};

const toOptional = (value: string | undefined | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const normalizeUf = (value: unknown): string => {
  const normalized = toStringValue(value)
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z]/g, "")
    .trim()
    .toUpperCase();

  return normalized.slice(0, 2);
};
export const settingsService = {
  async getTenantIdentity(): Promise<{ name: string; shortName: string; logoUrl?: string } | null> {
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
  },

  async getEntity(scope: UnitReadScope): Promise<ServiceResponse<EntitySettings>> {
    // 1. Buscar dados institucionais
    let entityQuery = supabase
      .from(ENTITY_TABLE)
      .select("*")
      .limit(1);
    if (scope.tenantId) entityQuery = entityQuery.eq("tenant_id", scope.tenantId);
    if (scope.unitId) entityQuery = entityQuery.eq("unit_id", scope.unitId);
    const { data: entityData, error: entityError } = await entityQuery.maybeSingle();

    if (entityError) {
      console.error("Erro ao buscar entidade:", entityError);
      return { data: null, error: entityError };
    }

    // 2. Buscar dados de configuração/aparência
    let configQuery = supabase.from(CONFIG_TABLE).select("*").limit(1);
    if (scope.tenantId) configQuery = configQuery.eq("tenant_id", scope.tenantId);
    if (scope.unitId) configQuery = configQuery.eq("unit_id", scope.unitId);
    const { data: configData, error: configError } = await configQuery.maybeSingle();

    if (configError) {
      console.error("Erro ao buscar configurações da entidade:", configError);
      return { data: null, error: configError };
    }

    if (!entityData) {
      return {
        data: { ...defaultEntitySettings },
        error: null,
      };
    }

    // 3. Compor URL do logo se o path existir
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

        // Dados de Aparência (vindos de configuracao_entidade)
        corPrimaria: toStringValue(configData?.cor_primaria, BRANDING_COLORS.primary),
        corSecundaria: toStringValue(configData?.cor_secundaria, BRANDING_COLORS.secondary),
        corSidebar: toStringValue(configData?.cor_sidebar, BRANDING_COLORS.primary),
        logoPath: configData?.logo_path ? String(configData.logo_path) : undefined,
        logoUrl: logoUrl,
      },
      error: null,
    };
  },
  async updateEntitySettings(
    settings: EntitySettings,
    scope: UnitWriteScope,
  ): Promise<ServiceResponse<EntitySettings>> {
    // 1. Atualizar dados institucionais
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

    // 2. Atualizar dados de configuração/aparência
    // Nota: Como é multi-tenant e só tem uma linha, buscamos o ID da config se necessário 
    // ou usamos o fato de que o upsert lidará com isso se tivermos o ID da config.
    // Para simplificar, buscamos o primeiro registro da config.
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

    return this.getEntity(scope);
  },
  async getLocalities(unitId?: string | null): Promise<ServiceResponse<Locality[]>> {
    let query = supabase
      .from(LOCALITIES_TABLE)
      .select("id, nome, codigo_localidade")
      .order("nome", { ascending: true });
    if (unitId) query = query.eq("unit_id", unitId);
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar localidades:", error);
      return { data: null, error };
    }
    const localities = (data || []).map((item) => ({
      id: String(item.id),
      name: String(item.nome ?? ""),
      code: String(item.codigo_localidade ?? ""),
    }));
    return { data: localities, error: null };
  },
  async saveLocality(locality: Locality, scope: UnitWriteScope): Promise<ServiceResponse<Locality>> {
    const normalizedName = locality.name.trim().toUpperCase();

    if (locality.id) {
      const { data, error } = await supabase
        .from(LOCALITIES_TABLE)
        .update({
          nome: normalizedName || null,
        })
        .eq("id", locality.id)
        .select("id, nome, codigo_localidade")
        .single();

      if (error) {
        console.error("Erro ao atualizar localidade:", error);
        return { data: null, error };
      }

      return {
        data: {
          id: String(data.id),
          name: String(data.nome ?? ""),
          code: String(data.codigo_localidade ?? ""),
        },
        error: null
      };
    }

    const { data, error } = await supabase
      .from(LOCALITIES_TABLE)
      .insert({
        nome: normalizedName || null,
        unit_id: scope.unitId,
        tenant_id: scope.tenantId,
      })
      .select("id, nome, codigo_localidade")
      .single();

    if (error) {
      console.error("Erro ao adicionar localidade:", error);
      return { data: null, error };
    }

    return {
      data: {
        id: String(data.id),
        name: String(data.nome ?? ""),
        code: String(data.codigo_localidade ?? ""),
      },
      error: null
    };
  },
  async deleteLocality(id: string): Promise<ServiceResponse<void>> {
    const { data, error } = await supabase
      .from(LOCALITIES_TABLE)
      .delete()
      .select("id")
      .eq("id", id);
    if (error) {
      console.error("Erro ao excluir localidade:", error);
      return { data: null, error };
    }
    if (!data || data.length === 0) {
      return {
        data: null,
        error: new Error("A localidade nao foi excluida. Verifique se seu perfil tem permissao para essa operacao."),
      };
    }
    return { data: null, error: null };
  },
  async getPortarias(unitId?: string | null): Promise<ServiceResponse<Portaria[]>> {
    let query = supabase
      .from(PORTARIAS_TABLE)
      .select("id, codigo_portaria, nome, is_active")
      .eq("is_active", true)
      .order("codigo_portaria", { ascending: true });
    if (unitId) query = query.eq("unit_id", unitId);
    const { data, error } = await query;
    if (error) {
      console.error("Erro ao buscar portarias:", error);
      return { data: null, error };
    }
    const portarias = (data || []).map((item) => ({
      id: String(item.id),
      codigoPortaria: String(item.codigo_portaria ?? ""),
      nome: String(item.nome ?? ""),
      isActive: Boolean(item.is_active),
    }));
    return { data: portarias, error: null };
  },
  async savePortaria(portaria: Portaria, scope: UnitWriteScope): Promise<ServiceResponse<Portaria>> {
    const normalizedCodigo = portaria.codigoPortaria.trim().toUpperCase();
    const normalizedNome = portaria.nome.trim().toUpperCase();

    if (portaria.id) {
      const { data, error } = await supabase
        .from(PORTARIAS_TABLE)
        .update({
          codigo_portaria: normalizedCodigo,
          nome: normalizedNome,
          updated_at: new Date().toISOString(),
        })
        .eq("id", portaria.id)
        .select("id, codigo_portaria, nome, is_active")
        .single();

      if (error) {
        console.error("Erro ao atualizar portaria:", error);
        return { data: null, error };
      }

      return {
        data: {
          id: String(data.id),
          codigoPortaria: String(data.codigo_portaria ?? ""),
          nome: String(data.nome ?? ""),
          isActive: Boolean(data.is_active),
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from(PORTARIAS_TABLE)
      .insert({
        codigo_portaria: normalizedCodigo,
        nome: normalizedNome,
        unit_id: scope.unitId,
        tenant_id: scope.tenantId,
      })
      .select("id, codigo_portaria, nome, is_active")
      .single();

    if (error) {
      console.error("Erro ao adicionar portaria:", error);
      return { data: null, error };
    }

    return {
      data: {
        id: String(data.id),
        codigoPortaria: String(data.codigo_portaria ?? ""),
        nome: String(data.nome ?? ""),
        isActive: Boolean(data.is_active),
      },
      error: null,
    };
  },
  async deletePortaria(id: string): Promise<ServiceResponse<void>> {
    const { data, error } = await supabase
      .from(PORTARIAS_TABLE)
      .delete()
      .select("id")
      .eq("id", id);
    if (error) {
      console.error("Erro ao excluir portaria:", error);
      return { data: null, error };
    }
    if (!data || data.length === 0) {
      return {
        data: null,
        error: new Error("A portaria nao foi excluida. Verifique se seu perfil tem permissao para essa operacao."),
      };
    }
    return { data: null, error: null };
  },
  async getDocumentTemplates(): Promise<ServiceResponse<DocumentTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from(DOCUMENT_TEMPLATES_TABLE)
        .select(
          "id, name, document_type, file_path, file_url, file_size, content_type, created_at, font_configurations",
        )
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Erro ao buscar templates de documentos:", error);
        return { data: null, error };
      }
      const templates = (data || []).map((item) => {
        const record = item as Record<string, unknown>;
        return {
          id: String(record.id),
          name: toStringValue(record.name),
          documentType: toStringValue(record.document_type),
          filePath: toStringValue(record.file_path),
          fileUrl: toStringValue(record.file_url),
          fileSize: Number(record.file_size ?? 0),
          contentType: toStringValue(record.content_type),
          createdAt: record.created_at ? toStringValue(record.created_at) : "",
          fontConfigurations: (() => {
            if (!record.font_configurations) return undefined;
            return typeof record.font_configurations === "string"
              ? record.font_configurations
              : JSON.stringify(record.font_configurations);
          })(),
        };
      });
      return { data: templates, error: null };
    } catch (error) {
      console.error(
        "Erro inesperado ao buscar templates de documentos:",
        error,
      );
      return { data: null, error: error as Error };
    }
  },
  async uploadDocumentTemplate(params: {
    file: File;
    name: string;
    documentType: string;
  }, scope: UnitWriteScope): Promise<ServiceResponse<DocumentTemplate>> {
    const file = params.file;
    const name = params.name.trim() || file.name;
    const documentType = params.documentType.trim();
    if (!file) {
      return {
        data: null,
        error: new Error("Arquivo do template é obrigatório."),
      };
    }
    if (!name) {
      return {
        data: null,
        error: new Error("Nome do template é obrigatório."),
      };
    }
    if (!documentType) {
      return {
        data: null,
        error: new Error("Tipo de documento é obrigatório."),
      };
    }
    let fontConfigurationsJSON: string | undefined = undefined;
    try {
      const { pdfFontExtractor } =
        await import("../../documents/services/pdf/fontExtraction/fontExtractor");
      const fileBuffer = await file.arrayBuffer();
      const fontConfigs =
        await pdfFontExtractor.extractFieldFontConfigurations(fileBuffer);
      const fieldConfigs = fontConfigs.fieldConfigurations || [];
      fontConfigurationsJSON =
        fieldConfigs.length > 0
          ? JSON.stringify(fieldConfigs)
          : JSON.stringify([]);
      console.log(`Extraído configurações de fonte para o template '${name}'`);
    } catch (fontError) {
      console.error(
        "Erro ao extrair configurações de fonte durante o upload:",
        fontError,
      );
    }
    const storage = supabase.storage.from(DOCUMENT_TEMPLATES_BUCKET);

    // Normalizar o nome do arquivo para evitar caracteres especiais e espaços que quebram o Storage
    const normalizeFileName = (fileName: string) => {
      return fileName
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "") // Mantemos regex para acentos (faixa de caracteres)
        .replaceAll(/\s/g, "-") // Substitui espaços por hifen
        .replaceAll(/[^\w.-]/g, "-") // Limpa caracteres especiais restantes
        .replaceAll(/-+/g, "-") // Remove hifens duplicados
        .toLowerCase();
    };

    const cleanFileName = normalizeFileName(file.name);
    const path = `templates/${Date.now()}-${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await storage.upload(
      path,
      file,
      {
        upsert: false,
        contentType: file.type || "application/pdf",
      },
    );
    if (uploadError) {
      console.error(
        "Erro ao enviar arquivo de template de documento:",
        uploadError,
      );
      return { data: null, error: uploadError };
    }
    const { data: publicUrlData } = storage.getPublicUrl(uploadData.path);
    const fileUrl = publicUrlData.publicUrl;
    const { data, error } = await supabase
      .from(DOCUMENT_TEMPLATES_TABLE)
      .insert({
        name,
        document_type: documentType,
        file_path: uploadData.path,
        file_url: fileUrl,
        file_size: file.size,
        content_type: file.type || "application/pdf",
        font_configurations: fontConfigurationsJSON,
        tenant_id: scope.tenantId,
      })
      .select(
        "id, name, document_type, file_path, file_url, file_size, content_type, created_at, font_configurations",
      )
      .single();
    if (error) {
      console.error("Erro ao salvar dados do template de documento:", error);
      return { data: null, error };
    }
    const record = data as Record<string, unknown>;
    return {
      data: {
        id: String(record.id),
        name: toStringValue(record.name),
        documentType: toStringValue(record.document_type),
        filePath: toStringValue(record.file_path),
        fileUrl: toStringValue(record.file_url),
        fileSize: Number(record.file_size ?? 0),
        contentType: toStringValue(record.content_type),
        createdAt: record.created_at ? toStringValue(record.created_at) : "",
        fontConfigurations: record.font_configurations
          ? toStringValue(record.font_configurations)
          : undefined,
      },
      error: null,
    };
  },
  async deleteDocumentTemplate(
    template: DocumentTemplate,
  ): Promise<ServiceResponse<void>> {
    const storage = supabase.storage.from(DOCUMENT_TEMPLATES_BUCKET);
    if (template.filePath) {
      const { error: storageError } = await storage.remove([template.filePath]);
      if (storageError) {
        console.error(
          "Erro ao remover arquivo do template de documento:",
          storageError,
        );
      }
    }
    const { data, error } = await supabase
      .from(DOCUMENT_TEMPLATES_TABLE)
      .delete()
      .select("id")
      .eq("id", template.id);
    if (error) {
      console.error("Erro ao excluir template de documento:", error);
      return { data: null, error };
    }
    if (!data || data.length === 0) {
      return {
        data: null,
        error: new Error("O template nao foi excluido. Verifique se seu perfil tem permissao para essa operacao."),
      };
    }
    return { data: null, error: null };
  },
};
