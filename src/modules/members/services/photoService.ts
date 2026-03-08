
import { supabase } from '@/shared/lib/supabase/client'

export const photoService = {
  /**
   * Obtém a URL da foto do sócio
   * Adiciona timestamp para evitar cache do navegador quando a foto é atualizada
   */
  async getPhotoUrl(cpf: string): Promise<string | null> {
    if (!cpf) return null

    // Remove caracteres não numéricos do CPF para garantir consistência
    const cleanCpf = cpf.replace(/\D/g, '')

    try {
      // Busca o registro na tabela de fotos apenas para confirmar existência
      const { data, error } = await supabase
        .from('fotos')
        .select('cpf')
        .eq('cpf', cleanCpf)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar foto:', error)
        return null
      }

      // Se não encontrar registro, não tem foto
      if (!data) return null

      // Constrói a URL pública manualmente
      const fileName = `${cleanCpf}.jpg`
      const { data: publicUrlData } = supabase.storage
        .from('fotos_socios')
        .getPublicUrl(fileName)
        
      if (!publicUrlData.publicUrl) return null

      // Retorna a URL direta (sem cache busting por timestamp pois não temos updated_at)
      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Erro inesperado ao buscar foto:', error)
      return null
    }
  },

  /**
   * Faz upload da foto do sócio
   */
  async uploadPhoto(file: File, cpf: string): Promise<string | null> {
    if (!cpf) throw new Error('CPF é obrigatório')
    
    const cleanCpf = cpf.replace(/\D/g, '')
    const fileName = `${cleanCpf}.jpg`

    // 1. Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from('fotos_socios')
      .upload(fileName, file, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '0' // Evita cache no CDN
      })

    if (uploadError) throw uploadError

    // 2. Obtém a URL pública
    const { data: publicUrlData } = supabase.storage
      .from('fotos_socios')
      .getPublicUrl(fileName)

    if (!publicUrlData.publicUrl) throw new Error('Erro ao gerar URL pública')

    // 3. Atualiza a tabela de fotos (apenas registra o CPF)
    const { error: dbError } = await supabase
      .from('fotos')
      .upsert({ 
        cpf: cleanCpf
      }, { onConflict: 'cpf' })

    if (dbError) throw dbError

    // Retorna a URL com timestamp atual para forçar atualização imediata na UI
    return `${publicUrlData.publicUrl}?t=${Date.now()}`
  },

  /**
   * Remove a foto do sócio
   */
  async deletePhoto(cpf: string): Promise<void> {
    if (!cpf) return
    
    const cleanCpf = cpf.replace(/\D/g, '')
    const fileName = `${cleanCpf}.jpg`

    // 1. Remove do Storage
    const { error: storageError } = await supabase.storage
      .from('fotos_socios')
      .remove([fileName])

    if (storageError) console.error('Erro ao remover do storage:', storageError)

    // 2. Remove da tabela
    const { error: dbError } = await supabase
      .from('fotos')
      .delete()
      .eq('cpf', cleanCpf)

    if (dbError) throw dbError
  }
}
