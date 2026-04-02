import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import {
  EntitySettings,
  defaultEntitySettings,
  SystemParameters,
  DocumentTemplate,
  Locality,
  PasswordChangeInput,
} from "../types/settings.types";
const ENTITY_TABLE = "entidade";
const PARAMETERS_TABLE = "parametros";
const DOCUMENT_TEMPLATES_TABLE = "templates";
const DOCUMENT_TEMPLATES_BUCKET = "documentos";
const LOCALITIES_TABLE = "localidades";
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
export const settingsService = {
  async getEntity(): Promise<ServiceResponse<EntitySettings>> {
    const { data, error } = await supabase
      .from(ENTITY_TABLE)
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Erro ao buscar entidade:", error);
      return { data: null, error };
    }
    if (!data) {
      return {
        data: { ...defaultEntitySettings },
        error: null,
      };
    }
    return {
      data: data
        ? {
          id: data.id ? String(data.id) : undefined,
          name: toStringValue(data.nome_entidade),
          shortName: toStringValue(data.nome_abreviado),
          cnpj: toStringValue(data.cnpj),
          street: toStringValue(data.endereco),
          district: toStringValue(data.bairro),
          city: toStringValue(data.cidade),
          state: toStringValue(data.uf),
          cep: toStringValue(data.cep),
          phone1: toStringValue(data.fone),
          phone2: toStringValue(data.celular),
          email: toStringValue(data.email),
          federation: toStringValue(data.federacao),
          confederation: toStringValue(data.confederacao),
          pole: toStringValue(data.polo),
          foundation: toStringValue(data.fundacao),
          county: toStringValue(data.comarca),
          number: toStringValue(data.numero),
          presidentName: toStringValue(data.nome_do_presidente),
          presidentCpf: toStringValue(data.cpf_do_presidente),
        }
        : null,
      error: null,
    };
  },
  async updateEntitySettings(
    settings: EntitySettings,
  ): Promise<ServiceResponse<EntitySettings>> {
    const { error } = await supabase
      .from(ENTITY_TABLE)
      .upsert({
        id: settings.id,
        nome_entidade: toNullable(settings.name),
        nome_abreviado: toNullable(settings.shortName),
        cnpj: toNullable(settings.cnpj),
        endereco: toNullable(settings.street),
        numero: toNullable(settings.number),
        bairro: toNullable(settings.district),
        cidade: toNullable(settings.city),
        uf: toNullable(settings.state),
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
      })
      .select()
      .single();
    if (error) {
      console.error("Erro ao salvar entidade:", error);
      return { data: null, error };
    }
    return this.getEntity();
  },
  async getParameters(): Promise<ServiceResponse<SystemParameters>> {
    const { data, error } = await supabase
      .from(PARAMETERS_TABLE)
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Erro ao buscar parâmetros:", error);
      return { data: null, error };
    }
    if (!data) {
      return {
        data: {
          maintenanceMode: false,
          maxUploadSize: 5,
          allowedFileTypes: [".pdf", ".jpg", ".png"],
          sessionTimeout: 30,
          defeso1Start: null,
          defeso1End: null,
          defeso2Start: null,
          defeso2End: null,
          defesoSpecies: "",
          publicationNumber: "",
          publicationDate: null,
          publicationLocal: "",
          fishingArea: "",
        },
        error: null,
      };
    }
    return {
      data: {
        id: data.id ? String(data.id) : undefined,
        maintenanceMode: false,
        maxUploadSize: 5,
        allowedFileTypes: [".pdf", ".jpg", ".png"],
        sessionTimeout: 30,
        defeso1Start: (data.inicio_pesca1 as string) || null,
        defeso1End: (data.final_pesca1 as string) || null,
        defeso2Start: (data.inicio_pesca2 as string) || null,
        defeso2End: (data.final_pesca2 as string) || null,
        defesoSpecies: (data.especies_proibidas as string) || "",
        publicationNumber: (data.nr_publicacao as string) || "",
        publicationDate: (data.data_publicacao as string) || null,
        publicationLocal: (data.localpesca as string) || "",
        fishingArea: (data.local_pesca as string) || "",
      },
      error: null,
    };
  },
  async saveParameters(
    input: SystemParameters,
  ): Promise<ServiceResponse<SystemParameters>> {
    let parameterId = input.id;
    if (!parameterId) {
      const { data: latest, error: latestError } = await supabase
        .from(PARAMETERS_TABLE)
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestError) {
        console.error("Erro ao identificar parâmetro existente:", latestError);
        return { data: null, error: latestError };
      }
      parameterId = latest?.id ? String(latest.id) : undefined;
    }
    const payload = {
      ...(parameterId ? { id: parameterId } : {}),
      inicio_pesca1: toNullable(input.defeso1Start),
      final_pesca1: toNullable(input.defeso1End),
      inicio_pesca2: toNullable(input.defeso2Start),
      final_pesca2: toNullable(input.defeso2End),
      especies_proibidas: toNullable(input.defesoSpecies),
      nr_publicacao: toNullable(input.publicationNumber),
      data_publicacao: toNullable(input.publicationDate),
      localpesca: toNullable(input.publicationLocal),
      local_pesca: toNullable(input.fishingArea),
    };
    const { error } = await supabase
      .from(PARAMETERS_TABLE)
      .upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("Erro ao salvar parâmetros:", error);
      let errorMessage = "Erro ao salvar parâmetros.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      return { data: null, error: new Error(errorMessage) };
    }
    return this.getParameters();
  },
  async getLocalities(): Promise<ServiceResponse<Locality[]>> {
    const { data, error } = await supabase
      .from(LOCALITIES_TABLE)
      .select("id, nome, codigo_localidade")
      .order("nome", { ascending: true });
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
  async saveLocality(locality: Locality): Promise<ServiceResponse<Locality>> {
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
    const { error } = await supabase
      .from(LOCALITIES_TABLE)
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Erro ao excluir localidade:", error);
      return { data: null, error };
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
  }): Promise<ServiceResponse<DocumentTemplate>> {
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
    const { error } = await supabase
      .from(DOCUMENT_TEMPLATES_TABLE)
      .delete()
      .eq("id", template.id);
    if (error) {
      console.error("Erro ao excluir template de documento:", error);
      return { data: null, error };
    }
    return { data: null, error: null };
  },
  async changePassword(
    input: PasswordChangeInput,
  ): Promise<ServiceResponse<void>> {
    const { auth } = supabase;
    const {
      data: { user },
      error: userError,
    } = await auth.getUser();
    if (userError) {
      console.error("Erro ao obter usuário atual:", userError);
      return { data: null, error: userError };
    }
    if (!user?.email) {
      return {
        data: null,
        error: new Error(
          "Usuário atual não possui email disponível para revalidação.",
        ),
      };
    }
    const { error: signInError } = await auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });
    if (signInError) {
      console.error("Erro ao validar senha atual:", signInError);
      return { data: null, error: signInError };
    }
    const { error: updateError } = await auth.updateUser({
      password: input.newPassword,
    });
    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      return { data: null, error: updateError };
    }
    return { data: null, error: null };
  },
};
