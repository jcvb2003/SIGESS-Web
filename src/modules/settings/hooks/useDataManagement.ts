import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/shared/lib/supabase/client";
export interface ImportReport {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  notFound: number;
  details: string[];
}
interface DirectoryEntryLike {
  kind: "file" | "directory" | string;
  getFile?: () => Promise<File>;
}
interface DirectoryHandleLike {
  values: () => AsyncIterable<DirectoryEntryLike>;
}
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Erro desconhecido";
}
export function useDataImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const fetchAllMembers = async () => {
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .order("nome", { ascending: true });
    if (error) throw error;
    return data || [];
  };
  const exportToCsv = async () => {
    try {
      setIsExporting(true);
      const data = (await fetchAllMembers()) as Record<string, unknown>[];
      if (data.length === 0) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map((row) =>
        Object.values(row)
          .map((value) => {
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            return stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(","),
      );
      const content = [headers, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + content], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `socios_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${data.length} registros exportados com sucesso.`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };
  const exportToXlsx = async () => {
    try {
      setIsExporting(true);
      const data = await fetchAllMembers();
      if (data.length === 0) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sócios");
      XLSX.writeFile(
        workbook,
        `socios_export_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success(`${data.length} registros exportados com sucesso.`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };
  return {
    isExporting,
    exportToCsv,
    exportToXlsx,
  };
}
export function usePhotoImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const cancelRef = useRef(false);
  const cleanCpf = (cpf: string) => cpf.replace(/\D/g, "");
  const fetchAllMembers = async () => {
    const { data, error } = await supabase
      .from("socios")
      .select("id, nome, cpf");
    if (error) throw error;
    const memberMap = new Map<
      string,
      {
        id: string;
        nome: string;
        originalCpf: string;
      }
    >();
    const members = (data || []) as Array<{
      id: string;
      nome: string;
      cpf: string | null;
    }>;
    members.forEach((member) => {
      if (member.cpf) {
        memberMap.set(cleanCpf(member.cpf), {
          id: member.id,
          nome: member.nome,
          originalCpf: member.cpf,
        });
      }
    });
    return memberMap;
  };
  const checkPhotoExists = async (cpf: string) => {
    const { data } = await supabase
      .from("fotos")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();
    return !!data;
  };
  const uploadPhoto = async (file: File, memberCpf: string) => {
    const fileName = `${memberCpf}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("fotos")
      .upload(fileName, file, {
        upsert: true,
        contentType: "image/jpeg",
      });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage
      .from("fotos_socios")
      .getPublicUrl(fileName);
    const { error: dbError } = await supabase.from("fotos").upsert(
      {
        cpf: memberCpf,
        foto_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cpf" },
    );
    if (dbError) throw dbError;
  };
  const importPhotos = async (
    directoryHandle: DirectoryHandleLike,
    mode: "all" | "newOnly",
  ) => {
    try {
      setIsImporting(true);
      setProgress(0);
      setReport(null);
      cancelRef.current = false;
      const memberMap = await fetchAllMembers();
      const files: File[] = [];
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === "file" && entry.getFile) {
          const file = await entry.getFile();
          if (file.type.startsWith("image/")) {
            files.push(file);
          }
        }
      }
      const total = files.length;
      if (total === 0) {
        toast.error("Nenhuma imagem encontrada na pasta selecionada.");
        setIsImporting(false);
        return;
      }
      const currentReport: ImportReport = {
        total,
        success: 0,
        failed: 0,
        skipped: 0,
        notFound: 0,
        details: [],
      };
      for (let i = 0; i < total; i++) {
        if (cancelRef.current) {
          toast.info("Importação cancelada pelo usuário.");
          break;
        }
        const file = files[i];
        setCurrentFile(file.name);
        setProgress(Math.round(((i + 1) / total) * 100));
        const potentialCpf = file.name.split(".")[0].replace(/\D/g, "");
        const member = memberMap.get(potentialCpf);
        if (!member) {
          currentReport.notFound++;
          continue;
        }
        try {
          if (mode === "newOnly") {
            const exists = await checkPhotoExists(member.originalCpf);
            if (exists) {
              currentReport.skipped++;
              continue;
            }
          }
          await uploadPhoto(file, cleanCpf(member.originalCpf));
          currentReport.success++;
        } catch (error: unknown) {
          console.error(`Erro ao importar ${file.name}:`, error);
          currentReport.failed++;
          currentReport.details.push(
            `Erro em ${file.name}: ${getErrorMessage(error)}`,
          );
        }
      }
      setReport(currentReport);
      toast.success(
        `Importação concluída: ${currentReport.success} fotos importadas.`,
      );
    } catch (error: unknown) {
      console.error("Erro geral na importação:", error);
      toast.error(`Erro na importação: ${getErrorMessage(error)}`);
    } finally {
      setIsImporting(false);
      setCurrentFile("");
      setProgress(0);
    }
  };
  const cancelImport = () => {
    cancelRef.current = true;
  };
  return {
    isImporting,
    progress,
    currentFile,
    report,
    importPhotos,
    cancelImport,
  };
}
