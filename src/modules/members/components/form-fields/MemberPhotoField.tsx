import { useFormContext, useWatch } from "react-hook-form";
import { usePhotoManager } from "../../hooks/registration/usePhotoManager";
import { Camera, Loader2, ImagePlus, Trash2, Check, X } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { compressMemberPhoto } from "@/shared/utils/image-compression";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

export function MemberPhotoField() {
  const { control } = useFormContext();
  const cpf = useWatch({ control, name: "cpf" });
  const {
    photoUrl: managerPhotoUrl,
    isLoading,
    uploadPhoto: handleStagePhoto,
    stagedFile,
    stagedDelete,
    deletePhoto,
  } = usePhotoManager({ cpf });

  const { setValue } = useFormContext();
  const photoUrl = useWatch({ control, name: "photoPreviewUrl" }) || managerPhotoUrl;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  const clearPendingPhoto = useCallback(() => {
    if (pendingPhoto?.previewUrl) {
      URL.revokeObjectURL(pendingPhoto.previewUrl);
    }
    setPendingPhoto(null);
  }, [pendingPhoto]);

  useEffect(() => {
    setValue("photoFile", stagedFile);
  }, [stagedFile, setValue]);

  useEffect(() => {
    if (!isLoading) {
      setValue("photoPreviewUrl", managerPhotoUrl);
    }
  }, [managerPhotoUrl, isLoading, setValue]);

  useEffect(() => {
    setValue("photoDelete", stagedDelete);
  }, [stagedDelete, setValue]);

  useEffect(() => {
    return () => {
      if (pendingPhoto?.previewUrl) {
        URL.revokeObjectURL(pendingPhoto.previewUrl);
      }
    };
  }, [pendingPhoto]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBlob = await compressMemberPhoto(file);
      const previewUrl = URL.createObjectURL(compressedBlob);

      const compressedFile = new File([compressedBlob], "member_photo.jpg", {
        type: "image/jpeg",
      });

      setPendingPhoto({
        file: compressedFile,
        previewUrl,
      });
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      toast.error("Erro ao processar imagem. Tente outro arquivo.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmUpload = () => {
    if (pendingPhoto) {
      handleStagePhoto(pendingPhoto.file);
      setPendingPhoto(null); // Don't revoke yet, usePhotoManager will handle preview
    }
  };

  const triggerFileInput = () => {
    if (!cpf) {
      toast.error("Informe o CPF primeiro para enviar a foto.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerFileInput();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      );
    }

    if (photoUrl) {
      return (
        <>
          <img
            src={photoUrl}
            alt="Foto do sócio"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3">
            <Camera className="h-6 w-6 text-white" />
            <div
              role="button"
              tabIndex={0}
              className="absolute top-1 right-1 p-1.5 bg-destructive/90 hover:bg-destructive rounded-full text-white transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                deletePhoto();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  deletePhoto();
                }
              }}
              title="Excluir foto"
              aria-label="Excluir foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-3">
        <div className="rounded-full bg-muted p-2.5">
          <ImagePlus className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <span className="text-[10px] text-muted-foreground/50 text-center leading-tight">
          Foto <br />
          (3x4/jpge/jpg/png)
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className="group relative w-[7.5rem] h-[9.5rem] rounded-lg border border-dashed border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50 overflow-hidden cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={triggerFileInput}
        onKeyDown={handleKeyDown}
        aria-label={photoUrl ? "Alterar foto do sócio" : "Adicionar foto do sócio"}
      >
        {renderContent()}
      </button>

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
    </div>
  );
}
