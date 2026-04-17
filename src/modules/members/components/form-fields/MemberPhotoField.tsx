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
  const { setValue, getValues, control } = useFormContext();
  const cpf = useWatch({ control, name: "cpf" });
  const photoUrl = useWatch({ control, name: "photoPreviewUrl" });

  // --- Estados Locais (UI Only) ---
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [hasImageError, setHasImageError] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef<string | null>(null);

  // --- Efeitos ---

  // 1. Carregamento Inicial do Storage
  useEffect(() => {
    if (!cpf) {
      loadedRef.current = null; // Reset quando CPF é limpo
      return;
    }

    if (loadedRef.current === cpf) return;

    // Se já tem valor (blob ou carregado anteriormente), apenas marca como carregado
    if (getValues("photoPreviewUrl")) {
      loadedRef.current = cpf;
      return;
    }

    // Se foi marcado para exclusão nesta sessão, não recarrega
    if (getValues("photoDelete") === true) return;

    // Carrega URL pública (operação síncrona no service)
    loadedRef.current = cpf;
    const url = photoService.getPhotoUrl(cpf);
    setValue("photoPreviewUrl", url ?? null);
    setHasImageError(false);
  }, [cpf, setValue, getValues]);

  // 2. Gestão de Memória (Blob URLs)
  useEffect(() => {
    const currentUrl = photoUrl;
    return () => {
      if (currentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [photoUrl]);

  // 3. Reset de Erro quando a URL muda
  useEffect(() => {
    setHasImageError(false);
  }, [photoUrl]);

  // --- Handlers ---

  const handleStagePhoto = useCallback((file: File, previewUrl: string) => {
    setValue("photoPreviewUrl", previewUrl);
    setValue("photoFile", file);
    setValue("photoDelete", false);
  }, [setValue]);

  const handleDeletePhoto = useCallback(() => {
    setValue("photoPreviewUrl", null);
    setValue("photoFile", null);
    setValue("photoDelete", true);
  }, [setValue]);

  const handleConfirmUpload = async () => {
    if (!pendingPhoto) return;

    handleStagePhoto(pendingPhoto.file, pendingPhoto.previewUrl);

    // Se veio via QR, limpa o token e o base64 do banco para economizar
    if (qrToken) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await ((supabase
        .from("foto_upload_tokens" as any) as any)
        .update({ foto_base64: null })
        .eq("token", qrToken));
      /* eslint-enable @typescript-eslint/no-explicit-any */
      setQrToken(null);
      setIsQrModalOpen(false);
    }

    setPendingPhoto(null);
  };

  const handleCancelPending = useCallback(() => {
    // Se a URL do pending NÃO for a que está no form, ela será revogada pelo cleanup do estado se mudarmos,
    // mas aqui como estamos apenas limpando o estado local 'pendingPhoto', e ele tem sua própria previewUrl,
    // precisamos garantir que ela não vaze se for cancelada antes de ir para o form.
    if (pendingPhoto?.previewUrl?.startsWith("blob:")) {
      // Mas espere, se cancelarmos, o pendingPhoto vira null. O cleanup do useEffect acima é para 'photoUrl' (do form).
      // Então precisamos revogar manualmente o blob do pendingPhoto se ele for descartado.
      URL.revokeObjectURL(pendingPhoto.previewUrl);
    }
    setPendingPhoto(null);
  }, [pendingPhoto]);

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generatePhotoToken = async () => {
    if (!cpf) {
      toast.error("Informe o CPF primeiro para gerar o QR Code.");
      return;
    }

    setIsGeneratingToken(true);
    try {
      const cleanCpf = cpf.replaceAll(/\D/g, "");
      const { data, error } = await (supabase
        .from("foto_upload_tokens" as unknown as "foto_upload_tokens")
        .insert([{ socio_cpf: cleanCpf }])
        .select("token")
        .single());

      if (error) throw error;
      if (data) setQrToken((data as unknown as { token: string }).token);
      setIsQrModalOpen(true);
    } catch (error) {
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

      setPendingPhoto({ file: compressedFile, previewUrl });
      toast.success("Foto recebida do celular! Revise e confirme.");
    } catch (error) {
      console.error("Erro ao processar foto remota:", error);
      toast.error("Erro ao processar foto do celular.");
    }
  }, []);

  // Monitorar QR Code
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

  // --- Lógica de UI ---

  const isLoadingInitial = !photoUrl && !!cpf && loadedRef.current !== cpf && !getValues("photoDelete");
  const tenantCode = localStorage.getItem('sigess_tenant') || resolveTenantBySupabaseUrl(import.meta.env.VITE_SUPABASE_URL) || '';
  const uploadUrl = `${globalThis.location.origin}/foto-upload?t=${qrToken}&tenant=${tenantCode}`;

  const renderContent = () => {
    if (isLoadingInitial) {
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
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
            <button
              type="button"
              className="absolute top-1 right-1 p-1.5 bg-destructive/90 hover:bg-destructive rounded-full text-white transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePhoto();
              }}
              title="Excluir foto"
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

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="group relative w-[7.5rem] h-[9.5rem] rounded-lg border border-dashed border-border hover:border-primary/40 bg-muted/30 overflow-hidden transition-all duration-200"
      >
        {renderContent()}

        {(!photoUrl || hasImageError) && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-10 w-full px-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full shadow-md transition-all active:scale-95 bg-background"
              onClick={generatePhotoToken}
              disabled={isGeneratingToken}
              title="Mandar link (QR Code)"
            >
              {isGeneratingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-full shadow-md transition-all active:scale-95 bg-background"
              onClick={() => fileInputRef.current?.click()}
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
        title="Selecionar foto do sócio"
        aria-label="Selecionar foto do sócio"
      />

      {/* Diálogo de Confirmação */}
      <Dialog open={!!pendingPhoto} onOpenChange={(open) => !open && handleCancelPending()}>
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
                  alt="Prévia"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelPending} className="flex-1">
              <X className="h-4 w-4 mr-2" /> Cancelar
            </Button>
            <Button onClick={handleConfirmUpload} className="flex-1">
              <Check className="h-4 w-4 mr-2" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isQrModalOpen} onOpenChange={(open) => !open && setIsQrModalOpen(false)}>
        <DialogContent className="max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Mandar Foto pelo Celular</DialogTitle>
            <DialogDescription className="text-center">
              Escaneie o código abaixo com a câmera do celular ou acesse{" "}
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary text-[11px] border border-border/50">
                app.sigess.com.br/foto-upload
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-muted/20">
              {qrToken && <QRCodeCanvas value={uploadUrl} size={200} level="H" marginSize={4} />}
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider animate-pulse">Aguardando foto...</span>
              <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
                A imagem aparecerá aqui no computador assim que você confirmar no celular.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsQrModalOpen(false)} className="w-full">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
