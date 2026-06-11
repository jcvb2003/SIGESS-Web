import { useFormContext, useWatch } from "react-hook-form";
import {
  Camera,
  Loader2,
  ImagePlus,
  Trash2,
  Check,
  X,
  QrCode,
  Upload,
  Smartphone,
} from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { compressMemberPhoto } from "@/shared/utils/image-compression";
import { supabase } from "@/shared/lib/supabase/client";
import { resolveTenantIdViaTenantUsers } from "@/shared/utils/tenant";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
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
  const { activeUnit } = useTenantUnits();

  // photoUrl vive inteiramente no form - sobrevive ao unmount/remount das abas
  const photoUrl = useWatch({ control, name: "photoPreviewUrl" });

  const [isLoading, setIsLoading] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  const prevPhotoUrlRef = useRef<string | null | undefined>(undefined);
  // Garante que a carga inicial do storage so ocorre uma vez por CPF
  const initialLoadCpfRef = useRef<string | null>(null);

  // So reseta o erro quando a URL realmente muda (nao no ciclo de montagem)
  useEffect(() => {
    if (
      prevPhotoUrlRef.current !== undefined &&
      prevPhotoUrlRef.current !== photoUrl
    ) {
      setHasImageError(false);
    }
    prevPhotoUrlRef.current = photoUrl;
  }, [photoUrl]);

  // Carrega URL inicial do storage apenas se o form ainda nao tiver valor
  // e apenas uma vez por CPF (nao sobrescreve uploads/deletes posteriores)
  useEffect(() => {
    if (!cpf) return;
    const currentUrl = getValues("photoPreviewUrl");
    // Se ja tem uma URL real no form (blob ou storage), nao sobrescreve
    if (currentUrl) {
      initialLoadCpfRef.current = cpf;
      return;
    }
    // Se o usuario ja deletou explicitamente a foto nesta sessao, nao recarrega
    if (getValues("photoDelete") === true) return;
    // Se ja carregou para este CPF e nao houve reset (photoPreviewUrl ainda null),
    // nao tenta de novo para evitar loop - mas permite recarregar apos reset()
    if (initialLoadCpfRef.current === cpf) return;
    initialLoadCpfRef.current = cpf;
    setIsLoading(true);
    const url = photoService.getPhotoUrl(cpf, true);
    setValue("photoPreviewUrl", url ?? null);
    setIsLoading(false);
  }, [cpf, setValue, getValues]);

  // --- Handlers de foto (todos escrevem direto no form) ---

  const handleDeletePhoto = useCallback(() => {
    setValue("photoPreviewUrl", null, { shouldDirty: true });
    setValue("photoFile", null, { shouldDirty: true });
    setValue("photoDelete", true, { shouldDirty: true });
  }, [setValue]);

  const handleStagePhoto = useCallback(
    (file: File, previewUrl: string) => {
      setValue("photoPreviewUrl", previewUrl);
      setValue("photoFile", file);
      setValue("photoDelete", false);
      setHasImageError(false);
    },
    [setValue],
  );

  // --- QR Code Photo Upload ---
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (isQrModalOpen) {
      timeoutId = setTimeout(() => {
        setIsQrModalOpen(false);
        setQrToken(null);
        toast.info(
          "A sessão de captura por QR Code expirou após 10 minutos de inatividade.",
        );
      }, 10 * 60 * 1000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isQrModalOpen]);

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
      const tenantId =
        activeUnit?.tenantId ?? (await resolveTenantIdViaTenantUsers());
      const unitId = activeUnit?.id ?? null;

      if (!tenantId) {
        throw new Error("Escopo do tenant nao resolvido para gerar token de foto.");
      }

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { data, error } = await ((supabase.from(
        "foto_upload_tokens" as any,
      ) as any)
        .insert([{ socio_cpf: cleanCpf, tenant_id: tenantId, unit_id: unitId }])
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

      const compressedBlob = await compressMemberPhoto(
        new File([blob], "foto_mobile.jpg", { type: "image/jpeg" }),
      );
      const previewUrl = URL.createObjectURL(compressedBlob);
      const compressedFile = new File([compressedBlob], "member_photo.jpg", {
        type: "image/jpeg",
      });

      setPendingPhoto({ file: compressedFile, previewUrl });
      setIsQrModalOpen(false);
      toast.success("Foto recebida do celular! Revise e confirme.");
    } catch (error) {
      console.error("Erro ao processar foto remota:", error);
      toast.error("Erro ao processar foto vinda do celular.");
    }
  }, []);

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
        },
      )
      .subscribe();

    const intervalId = globalThis.setInterval(async () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const { data, error } = await ((supabase.from("foto_upload_tokens" as any) as any)
        .select("foto_base64")
        .eq("token", qrToken)
        .maybeSingle());
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (error) {
        return;
      }

      const tokenData = data as { foto_base64?: string | null } | null;
      if (tokenData?.foto_base64) {
        await processBase64Photo(tokenData.foto_base64);
      }
    }, 2000);

    return () => {
      globalThis.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [qrToken, isQrModalOpen, processBase64Photo]);

  // --- Upload local ---

  const clearPendingPhoto = useCallback(() => {
    if (pendingPhoto?.previewUrl) {
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
      const compressedFile = new File([compressedBlob], "member_photo.jpg", {
        type: "image/jpeg",
      });

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

    if (qrToken) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await ((supabase.from("foto_upload_tokens" as any) as any)
        .update({ foto_base64: null })
        .eq("token", qrToken));
      /* eslint-enable @typescript-eslint/no-explicit-any */
      setQrToken(null);
    }

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

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
            <button
              type="button"
              className="absolute right-1 top-1 cursor-pointer rounded-full bg-destructive/90 p-1.5 text-white transition-colors hover:bg-destructive"
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
      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2 pb-6">
        <div className="rounded-full bg-muted p-2">
          <ImagePlus className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <span className="text-center text-[10px] leading-tight text-muted-foreground/50">
          Foto 3x4
        </span>
      </div>
    );
  };

  const tenantCode = localStorage.getItem("sigess_tenant") || "";
  const uploadUrl = `${globalThis.location.origin}/foto-upload?t=${qrToken}&tenant=${tenantCode}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="group relative h-[9.5rem] w-[7.5rem] overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 transition-all duration-200 hover:border-primary/40"
        aria-label={
          photoUrl && !hasImageError
            ? "Foto do sócio"
            : "Adicionar foto do sócio"
        }
      >
        {renderContent()}

        {(!photoUrl || hasImageError) && (
          <div className="absolute bottom-2 left-0 right-0 z-10 flex w-full justify-center gap-2 px-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md transition-all active:scale-95"
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
              className="h-8 w-8 rounded-full shadow-md transition-all active:scale-95"
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

      <Dialog
        open={!!pendingPhoto}
        onOpenChange={(open) => !open && clearPendingPhoto()}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Revisar Foto (3x4)</DialogTitle>
            <DialogDescription>
              Certifique-se de que a foto está bem enquadrada e com boa
              iluminação.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/10 py-4">
            <div className="h-[240px] w-[180px] overflow-hidden rounded-md border-2 border-primary/20 bg-muted/20 shadow-md">
              {pendingPhoto && (
                <img
                  src={pendingPhoto.previewUrl}
                  alt="Prévia da foto"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <p className="mt-4 px-4 text-center text-xs text-muted-foreground">
              Prévia da foto
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={clearPendingPhoto}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleConfirmUpload} className="flex-1">
              <Check className="mr-2 h-4 w-4" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isQrModalOpen}
        onOpenChange={(open) => !open && closeQrModal()}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              Envio remoto
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6">
              Escaneie o código abaixo com a câmera do celular ou abra o
              endereço para enviar a foto direto do navegador.
            </DialogDescription>
            <div className="flex items-baseline gap-2 text-sm">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Link direto
              </span>
              <span className="font-mono text-sm text-foreground/85">
                app.sigess.com.br/foto-upload
              </span>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  {qrToken && (
                    <QRCodeCanvas
                      value={uploadUrl}
                      size={200}
                      level="H"
                      marginSize={4}
                    />
                  )}
              </div>

            <p className="max-w-[240px] text-center text-xs leading-5 text-muted-foreground">
              A imagem aparecerá no computador assim que o envio for confirmado no celular.
            </p>
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
