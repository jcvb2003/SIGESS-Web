import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { UnitWriteScope } from "@/shared/types/scope";
import type { DocumentTemplate } from "../types/settings.types";

const DOCUMENT_TEMPLATES_TABLE = "templates";
const DOCUMENT_TEMPLATES_BUCKET = "documentos";

const toStringValue = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

async function getDocumentTemplates(): Promise<ServiceResponse<DocumentTemplate[]>> {
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
    console.error("Erro inesperado ao buscar templates de documentos:", error);
    return { data: null, error: error as Error };
  }
}

async function uploadDocumentTemplate(
  params: { file: File; name: string; documentType: string },
  scope: UnitWriteScope,
): Promise<ServiceResponse<DocumentTemplate>> {
  const file = params.file;
  const name = params.name.trim() || file.name;
  const documentType = params.documentType.trim();
  if (!file) {
    return { data: null, error: new Error("Arquivo do template é obrigatório.") };
  }
  if (!name) {
    return { data: null, error: new Error("Nome do template é obrigatório.") };
  }
  if (!documentType) {
    return { data: null, error: new Error("Tipo de documento é obrigatório.") };
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

  const normalizeFileName = (fileName: string) => {
    return fileName
      .normalize("NFD")
      .replaceAll(/[̀-ͯ]/g, "")
      .replaceAll(/\s/g, "-")
      .replaceAll(/[^\w.-]/g, "-")
      .replaceAll(/-+/g, "-")
      .toLowerCase();
  };

  const cleanFileName = normalizeFileName(file.name);
  const path = `templates/${Date.now()}-${cleanFileName}`;

  const { data: uploadData, error: uploadError } = await storage.upload(
    path,
    file,
    { upsert: false, contentType: file.type || "application/pdf" },
  );
  if (uploadError) {
    console.error("Erro ao enviar arquivo de template de documento:", uploadError);
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
}

async function deleteDocumentTemplate(
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
}

export const documentTemplateService = {
  getDocumentTemplates,
  uploadDocumentTemplate,
  deleteDocumentTemplate,
};
