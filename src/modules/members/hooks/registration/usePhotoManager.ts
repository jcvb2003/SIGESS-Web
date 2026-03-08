
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { photoService } from '../../services/photoService'

interface UsePhotoManagerProps {
  cpf?: string
  initialPhotoUrl?: string | null
}

export function usePhotoManager({ cpf, initialPhotoUrl }: UsePhotoManagerProps = {}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carrega a foto quando o CPF mudar
  useEffect(() => {
    let isMounted = true

    async function loadPhoto() {
      if (!cpf) {
        setPhotoUrl(null)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const url = await photoService.getPhotoUrl(cpf)
        if (isMounted) {
          setPhotoUrl(url)
        }
      } catch (err) {
        console.error('Erro ao carregar foto:', err)
        if (isMounted) {
          setError('Não foi possível carregar a foto.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPhoto()

    return () => {
      isMounted = false
    }
  }, [cpf])

  const handleUpload = useCallback(async (file: File) => {
    if (!cpf) {
      toast.error('CPF do sócio não encontrado para vincular a foto.')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Validações básicas
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('A imagem deve ter no máximo 5MB.')
        return
      }

      const newUrl = await photoService.uploadPhoto(file, cpf)
      setPhotoUrl(newUrl)
      toast.success('Foto atualizada com sucesso!')
    } catch (err) {
      console.error('Erro no upload:', err)
      setError('Erro ao enviar a foto. Tente novamente.')
      toast.error('Erro ao enviar a foto.')
    } finally {
      setIsUploading(false)
    }
  }, [cpf])

  const handleDelete = useCallback(async () => {
    if (!cpf) return

    try {
      setIsUploading(true) // Reutiliza estado de loading de ação
      await photoService.deletePhoto(cpf)
      setPhotoUrl(null)
      toast.success('Foto removida com sucesso.')
    } catch (err) {
      console.error('Erro ao remover foto:', err)
      toast.error('Erro ao remover a foto.')
    } finally {
      setIsUploading(false)
    }
  }, [cpf])

  return {
    photoUrl,
    isLoading,
    isUploading,
    error,
    uploadPhoto: handleUpload,
    deletePhoto: handleDelete,
    refreshPhoto: () => {
      // Força recarregamento (adiciona timestamp novo)
      if (cpf) {
        photoService.getPhotoUrl(cpf).then(url => {
            if (url) setPhotoUrl(`${url}&t=${Date.now()}`)
            else setPhotoUrl(null)
        })
      }
    }
  }
}
