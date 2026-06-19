import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { UnitWriteScope } from "@/shared/types/scope";
import type { SystemParameters } from "../types/settings.types";

const PARAMETERS_TABLE = "parametros";

const toNullable = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  return trimmed || null;
};

async function getParameters(
  unitId?: string | null,
): Promise<ServiceResponse<SystemParameters>> {
  let query = supabase
    .from(PARAMETERS_TABLE)
    .select("*")
    .order("id", { ascending: false })
    .limit(1);
  if (unitId) query = query.eq("unit_id", unitId);
  const { data, error } = await query.maybeSingle();
  if (error) return { data: null, error };
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
}

async function saveParameters(
  input: SystemParameters,
  scope: UnitWriteScope,
): Promise<ServiceResponse<SystemParameters>> {
  let parameterId = input.id;
  if (!parameterId) {
    let idQuery = supabase
      .from(PARAMETERS_TABLE)
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    if (scope.unitId) idQuery = idQuery.eq("unit_id", scope.unitId);
    const { data: latest, error: latestError } = await idQuery.maybeSingle();
    if (latestError) return { data: null, error: latestError };
    parameterId = latest?.id ? String(latest.id) : undefined;
  }
  const payload = {
    ...(parameterId ? { id: parameterId } : {}),
    tenant_id: scope.tenantId,
    unit_id: scope.unitId,
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "Erro ao salvar parâmetros.";
    return { data: null, error: new Error(errorMessage) };
  }
  return getParameters(scope.unitId);
}

export const parametersService = { getParameters, saveParameters };
