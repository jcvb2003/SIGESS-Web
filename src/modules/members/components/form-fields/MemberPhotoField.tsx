import { useFormContext, useWatch } from "react-hook-form";
import { Camera, Loader2, ImagePlus, Trash2, Check, X, QrCode, Upload } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { compressMemberPhoto } from "@/shared/utils/image-compression";
import { supabase } from "@/shared/lib/supabase/client";
import { resolveTenantBySupabaseUrl } from "@/config/tenants";
import { photoService } from "../../services/photoService";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

type FotoUploadToken = {
  token: string;
  socio_cpf: string;
  foto_base64: string | null;
  expires_at: string;
  created_at: string;
};

export function MemberPhotoField() {
  const { control, setValue, getValues } = useFormContext();
  const cpf = useWatch({ control, name: "cpf" });

  // photoUrl vive inteiramente no form — sobrevive ao unmount/remount das abas
  const photoUrl = useWatch({ control, name: "photoPreviewUrl" });

  const [isLoading, setIsLoading] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  const prevPhotoUrlRef = useRef<string | null | undefined>(undefined);
  // Garante que a carga inicial do storage só ocorre uma vez por CPF
  const initialLoadCpfRef = useRef<string | null>(null);

  // Só reseta o erro quando a URL realmente muda (não no ciclo de montagem)
  useEffect(() => {
    if (prevPhotoUrlRef.current !== undefined && prevPhotoUrlRef.current !== photoUrl) {
      setHasImageError(false);
    }
    prevPhotoUrlRef.current = photoUrl;
  }, [photoUrl]);

  // Carrega URL inicial do storage apenas se o form ainda não tiver valor
  // e apenas uma vez por CPF (não sobrescreve uploads/deletes posteriores)
  useEffect(() => {
    if (!cpf) return;
    const currentUrl = getValues("photoPreviewUrl");
    // Se já tem uma URL real no form (blob ou storage), não sobrescreve
    if (currentUrl) {
      initialLoadCpfRef.current = cpf;
      return;
    }
    // Se o usuário já deletou explicitamente a foto nesta sessão, não recarrega
    if (getValues("photoDelete") === true) return;
    // Se já carregou para este CPF e não houve reset (photoPreviewUrl ainda null),
    // não tenta de novo para evitar loop — mas permite recarregar após reset()
    if (initialLoadCpfRef.current === cpf) return;
    initialLoadCpfRef.current = cpf;
    setIsLoading(true);
    const url = photoService.getPhotoUrl(cpf);
    setValue("photoPreviewUrl", url ?? null);
    setIsLoading(false);
  }, [cpf, setValue, getValues]);

  // --- Handlers de foto (todos escrevem direto no form) ---

  const handleDeletePhoto = useCallback(() => {
    setValue("photoPreviewUrl", null);
    setValue("photoFile", null);
    setValue("photoDelete", true);
  }, [setValue]);

  const handleStagePhoto = useCallback((file: File, previewUrl: string) => {
    setValue("photoPreviewUrl", previewUrl);
    setValue("photoFile", file);
    setValue("photoDelete", false);
    setHasImageError(false); // Correção: Resetar erro para permitir exibição do blob
  }, [setValue]);

  // --- QR Code Photo Upload ---
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const closeQrModal = useCallback(() => {
    setIsQrModalOpen(false);
    setQrToken(null);
  }, []);

  const generatePhotoToken = async () => {
    if (!cpf) {
      toast.error("Informe o CPF primeiro para gerar o QR Code.");
      return;
    }

    setIsGeneratingToken(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { data, error } = await ((supabase
        .from("foto_upload_tokens" as any) as any)
        .insert([{ socio_cpf: cleanCpf }])
        .select("token")
        .single());
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (error) throw error;
      const tokenData = data as unknown as FotoUploadToken;
      setQrToken(tokenData.token);
      setIsQrModalOpen(true);
    } catch (error: unknown) {
      console.error("Erro ao gerar token:", error);
      toast.error("Erro ao preparar upload remoto.");
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const processBase64Photo = useCallback(async (base64: string) => {
    try {
      const res = await fetch(`data:image/jpeg;base64,${base64}`);
      const blob = await res.blob();

      const compressedBlob = await compressMemberPhoto(new File([blob], "foto_mobile.jpg", { type: "image/jpeg" }));
      const previewUrl = URL.createObjectURL(compressedBlob);
      const compressedFile = new File([compressedBlob], "member_photo.jpg", { type: "image/jpeg" });

      handleStagePhoto(compressedFile, previewUrl);
      setHasImageError(false); // Correção: Garantir que o erro seja limpo após o upload remoto
      setIsQrModalOpen(false);
      toast.success("Foto recebida do celular!");
    } catch (error) {
      console.error("Erro ao processar foto remota:", error);
      toast.error("Erro ao processar foto vinda do celular.");
    }
  }, [handleStagePhoto]);

  useEffect(() => {
    if (!qrToken || !isQrModalOpen) return;

    const channel = supabase
      .channel(`foto-token-${qrToken}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "foto_upload_tokens",
          filter: `token=eq.${qrToken}`,
        },
        async (payload) => {
          const newData = payload.new as FotoUploadToken;
          if (newData.foto_base64) {
            await processBase64Photo(newData.foto_base64);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qrToken, isQrModalOpen, processBase64Photo]);

  // --- Upload local ---

  const clearPendingPhoto = useCallback(() => {
    if (pendingPhoto?.previewUrl) {
      // Só revogar se a URL NÃO estiver em uso no form
      const formUrl = getValues("photoPreviewUrl");
      if (formUrl !== pendingPhoto.previewUrl) {
        URL.revokeObjectURL(pendingPhoto.previewUrl);
      }
    }
    setPendingPhoto(null);
  }, [pendingPhoto, getValues]);

  useEffect(() => {
    return () => {
      if (pendingPhoto?.previewUrl) {
        const formUrl = getValues("photoPreviewUrl");
        if (formUrl !== pendingPhoto.previewUrl) {
          URL.revokeObjectURL(pendingPhoto.previewUrl);
        }
      }
    };
  }, [pendingPhoto, getValues]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressMemberPhoto(file);
      const previewUrl = URL.createObjectURL(compressedBlob);
      const compressedFile = new File([compressedBlob], "member_photo.jpg", { type: "image/jpeg" });

      setPendingPhoto({ file: compressedFile, previewUrl });
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      toast.error("Erro ao processar imagem. Tente outro arquivo.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingPhoto) return;

    handleStagePhoto(pendingPhoto.file, pendingPhoto.previewUrl);

    // Limpar base64 do banco se veio via QR para economizar espaço
    if (qrToken) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await ((supabase
        .from("foto_upload_tokens" as any) as any)
        .update({ foto_base64: null })
        .eq("token", qrToken));
      /* eslint-enable @typescript-eslint/no-explicit-any */
      setQrToken(null);
    }

    // NÃO revogar a URL aqui — ela foi transferida para o form
    // Apenas limpar o estado sem chamar revokeObjectURL
    setPendingPhoto(null);
  };

  const triggerFileInput = () => {
    if (!cpf) {
      toast.error("Informe o CPF primeiro para enviar a foto.");
      return;
    }
    fileInputRef.current?.click();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      );
    }

    if (photoUrl && !hasImageError) {
      return (
        <>
          <img
            src={photoUrl}
            alt="Foto do sócio"
            onError={() => setHasImageError(true)}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3">
            <Camera className="h-6 w-6 text-white" />
            <button
              type="button"
              className="absolute top-1 right-1 p-1.5 bg-destructive/90 hover:bg-destructive rounded-full text-white transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePhoto();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeletePhoto();
                }
              }}
              title="Excluir foto"
              aria-label="Excluir foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center gap-1.5 px-2 pb-6">
        <div className="rounded-full bg-muted p-2">
          <ImagePlus className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <span className="text-[10px] text-muted-foreground/50 text-center leading-tight">
          Foto 3x4
        </span>
      </div>
    );
  };

  const tenantCode = localStorage.getItem('sigess_tenant') || resolveTenantBySupabaseUrl(import.meta.env.VITE_SUPABASE_URL) || '';
  const uploadUrl = `${globalThis.location.origin}/foto-upload?t=${qrToken}&tenant=${tenantCode}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="group relative w-[7.5rem] h-[9.5rem] rounded-lg border border-dashed border-border hover:border-primary/40 bg-muted/30 overflow-hidden transition-all duration-200"
        aria-label={photoUrl && !hasImageError ? "Foto do sócio" : "Adicionar foto do sócio"}
      >
        {renderContent()}

        {(!photoUrl || hasImageError) && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-10 w-full px-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full shadow-md transition-all active:scale-95"
              onClick={generatePhotoToken}
              disabled={isGeneratingToken}
              title="Mandar link (QR Code)"
            >
              {isGeneratingToken ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <QrCode className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full shadow-md transition-all active:scale-95"
              onClick={triggerFileInput}
              title="Fazer Upload local"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileSelect}
        aria-label="Selecionar foto do sócio"
        title="Selecionar foto do sócio"
      />

      <Dialog open={!!pendingPhoto} onOpenChange={(open) => !open && clearPendingPhoto()}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Revisar Foto (3x4)</DialogTitle>
            <DialogDescription>
              Certifique-se de que a foto está bem enquadrada e com boa iluminação.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 bg-muted/10 rounded-lg">
            <div className="w-[180px] h-[240px] rounded-md shadow-md overflow-hidden border-2 border-primary/20 bg-muted/20">
              {pendingPhoto && (
                <img
                  src={pendingPhoto.previewUrl}
                  alt="Prévia da foto"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center px-4">
              Prévia da foto
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={clearPendingPhoto}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleConfirmUpload} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQrModalOpen} onOpenChange={(open) => !open && closeQrModal()}>
        <DialogContent className="max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Mandar Foto pelo Celular</DialogTitle>
            <DialogDescription>
              Escaneie o código abaixo com a câmera do celular ou pelo site app.sigess.com.br/foto-upload.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-muted/20">
              {qrToken && (
                <QRCodeCanvas
                  value={uploadUrl}
                  size={200}
                  level="H"
                  marginSize={4}
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider animate-pulse">Aguardando foto...</span>
              <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
                A imagem aparecerá aqui no computador assim que você confirmar no celular.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeQrModal} className="w-full">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
