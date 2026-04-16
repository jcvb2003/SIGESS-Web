import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { photoService } from "../../services/photoService";

interface UsePhotoManagerProps {
  cpf?: string;
  initialPhotoUrl?: string | null;
}

export function usePhotoManager({
  cpf,
  initialPhotoUrl,
}: UsePhotoManagerProps = {}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (initialPhotoUrl) return initialPhotoUrl;
    if (cpf) return photoService.getPhotoUrl(cpf);
    return null;
  });
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedDelete, setStagedDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPhoto() {
      if (!cpf) {
        setPhotoUrl(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const url = photoService.getPhotoUrl(cpf);
        if (isMounted) {
          setPhotoUrl(url || initialPhotoUrl || null);
        }
      } catch (err) {
        console.error("Erro ao carregar foto:", err);
        if (isMounted) {
          setError("Não foi possível carregar a foto.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadPhoto();
    return () => {
      isMounted = false;
    };
  }, [cpf, initialPhotoUrl]);

  const handleStagePhoto = useCallback(
    async (file: File) => {
      try {
        setError(null);

        if (!file.type.startsWith("image/")) {
          toast.error("Por favor, selecione apenas arquivos de imagem.");
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error("A imagem deve ter no máximo 10MB.");
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        setPhotoUrl(previewUrl);
        setStagedFile(file);
        setStagedDelete(false);
      } catch (err) {
        console.error("Erro ao preparar foto:", err);
        setError("Erro ao processar a foto.");
      }
    },
    [],
  );

  const handleDelete = useCallback(async () => {
    setPhotoUrl(null);
    setStagedFile(null);
    setStagedDelete(true);
  }, []);

  return {
    photoUrl,
    isLoading,
    error,
    uploadPhoto: handleStagePhoto,
    stagedFile,
    stagedDelete,
    deletePhoto: handleDelete,
    refreshPhoto: () => {
      if (cpf) {
        const url = photoService.getPhotoUrl(cpf);
        setPhotoUrl(url ?? null);
      }
    },
  };
}
