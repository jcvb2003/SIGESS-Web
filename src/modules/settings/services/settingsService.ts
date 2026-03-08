import { supabase } from '@/shared/lib/supabase/client'
import {
  EntitySettings,
  ParametersSettings,
  PasswordChangeInput,
  defaultEntitySettings,
  defaultParametersSettings,
  SystemUser,
  Locality,
  DocumentTemplate,
} from '../types/settings.types'

const ENTITY_TABLE = 'entidade'
const PARAMETERS_TABLE = 'parametros'
const USERS_TABLE = 'User'
const LOCALITIES_TABLE = 'localidades'
const DOCUMENT_TEMPLATES_TABLE = 'document_templates'
const DOCUMENT_TEMPLATES_BUCKET = 'documents'

const toStringValue = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) {
    return fallback
  }
  return String(value)
}

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

function parseBackendDateToInput(value: string | null): string | null {
  if (!value) {
    return null
  }

  const raw = String(value).trim()

  if (!raw) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10)
  }

  const parts = raw.split(/[/-]/)

  if (parts.length !== 3) {
    return null
  }

  const [day, month, year] = parts

  const d = day.padStart(2, '0')
  const m = month.padStart(2, '0')
  const y = year.length === 2 ? `20${year}` : year.padStart(4, '0')

  return `${y}-${m}-${d}`
}

function formatInputDateToBackend(value: string | null): string | null {
  if (!value) {
    return null
  }

  const raw = String(value).trim()

  if (!raw) {
    return null
  }

  if (raw.includes('/')) {
    return raw
  }

  const parts = raw.split('-')

  if (parts.length !== 3) {
    return raw
  }

  const [year, month, day] = parts

  const d = day.padStart(2, '0')
  const m = month.padStart(2, '0')
  const y = year.padStart(4, '0')

  return `${d}/${m}/${y}`
}

export const settingsService = {
  async getEntity(): Promise<EntitySettings> {
    const { data, error } = await supabase
      .from(ENTITY_TABLE)
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar entidade:', error)
      throw error
    }

    if (!data) {
      return { ...defaultEntitySettings }
    }

    return {
      id: toOptionalNumber(data.id),
      name: toStringValue(data.nome_entidade),
      shortName: toStringValue(data.nome_abreviado),
      cnpj: toStringValue(data.cnpj),
      street: toStringValue(data.endereco),
      number: '',
      district: toStringValue(data.bairro),
      city: toStringValue(data.cidade),
      state: toStringValue(data.uf),
      cep: toStringValue(data.cep),
      phone1: toStringValue(data.fone),
      phone2: toStringValue(data.celular),
      email: toStringValue(data.email),
      federation: toStringValue(data.federacao),
      confederation: toStringValue(data.confederacao),
      pole: toStringValue(data.polo),
      foundation: toStringValue(data.fundacao),
      county: toStringValue(data.comarca),
    }
  },

  async saveEntity(input: EntitySettings): Promise<EntitySettings> {
    const payload = {
      id: input.id,
      nome_entidade: input.name,
      nome_abreviado: input.shortName,
      cnpj: input.cnpj,
      endereco: input.street,
      bairro: input.district,
      cidade: input.city,
      uf: input.state,
      cep: input.cep,
      fone: input.phone1,
      celular: input.phone2,
      email: input.email,
      federacao: input.federation,
      confederacao: input.confederation,
      polo: input.pole,
      fundacao: input.foundation,
      comarca: input.county,
    }

    const { error } = await supabase
      .from(ENTITY_TABLE)
      .upsert(payload)
      .select('*')

    if (error) {
      console.error('Erro ao salvar entidade:', error)
      throw error
    }

    return this.getEntity()
  },

  async getParameters(): Promise<ParametersSettings> {
    const { data, error } = await supabase
      .from(PARAMETERS_TABLE)
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar parâmetros:', error)
      throw error
    }

    if (!data) {
      return { ...defaultParametersSettings }
    }

    return {
      id: toOptionalNumber(data.id),
      defeso1Start: parseBackendDateToInput(toNullableString(data.inicio_pesca1)),
      defeso1End: parseBackendDateToInput(toNullableString(data.final_pesca1)),
      defeso2Start: parseBackendDateToInput(toNullableString(data.inicio_pesca2)),
      defeso2End: parseBackendDateToInput(toNullableString(data.final_pesca2)),
      defesoSpecies: toStringValue(data.especies_proibidas),
      publicationNumber: toStringValue(data.nr_publicacao),
      publicationDate: parseBackendDateToInput(toNullableString(data.data_publicacao)),
      publicationLocal: toStringValue(data.local_pesca),
      fishingArea: toStringValue(data.local_pesca),
    }
  },

  async saveParameters(input: ParametersSettings): Promise<ParametersSettings> {
    const payload = {
      id: input.id,
      inicio_pesca1: formatInputDateToBackend(input.defeso1Start),
      final_pesca1: formatInputDateToBackend(input.defeso1End),
      inicio_pesca2: formatInputDateToBackend(input.defeso2Start),
      final_pesca2: formatInputDateToBackend(input.defeso2End),
      especies_proibidas: input.defesoSpecies,
      nr_publicacao: input.publicationNumber,
      data_publicacao: formatInputDateToBackend(input.publicationDate),
      local_pesca: input.publicationLocal,
    }

    const { error } = await supabase
      .from(PARAMETERS_TABLE)
      .upsert(payload)

    if (error) {
      console.error('Erro ao salvar parâmetros:', error)
      throw error
    }

    return this.getParameters()
  },

  async getSystemUsers(): Promise<SystemUser[]> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id, email, createdAt, role')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários do sistema:', error)
      return []
    }

    if (!data) {
      return []
    }

    return (data || []).map((item) => {
      const record = item as Record<string, unknown>
      return {
        id: String(record.id),
        email: String(record.email ?? ''),
        role: String(record.role ?? 'user'),
        createdAt: record.createdAt ? String(record.createdAt) : '',
      }
    })
  },

  async getLocalities(): Promise<Locality[]> {
    const { data, error } = await supabase
      .from(LOCALITIES_TABLE)
      .select('id, nome, codigo_localidade')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar localidades:', error)
      return []
    }

    if (!data) {
      return []
    }

    return (data || []).map((item) => {
      const record = item as Record<string, unknown>
      return {
        id: String(record.id),
        name: String(record.nome ?? ''),
        code: record.codigo_localidade ? String(record.codigo_localidade) : '',
      }
    })
  },

  async saveLocality(params: { id?: string; name: string }): Promise<void> {
    const rawName = params.name.trim()

    if (!rawName) {
      throw new Error('Nome da localidade é obrigatório.')
    }

    const normalizedName = rawName.toUpperCase()

    if (params.id) {
      const { error } = await supabase
        .from(LOCALITIES_TABLE)
        .update({ nome: normalizedName })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao atualizar localidade:', error)
        throw error
      }

      return
    }

    const { data: maxCodeData, error: maxCodeError } = await supabase
      .from(LOCALITIES_TABLE)
      .select('codigo_localidade')
      .order('codigo_localidade', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxCodeError && maxCodeError.code !== 'PGRST116') {
      console.error('Erro ao buscar código máximo de localidade:', maxCodeError)
      throw maxCodeError
    }

    const nextCode = maxCodeData?.codigo_localidade
      ? (parseInt(String(maxCodeData.codigo_localidade), 10) + 1).toString()
      : '1'

    const { error } = await supabase
      .from(LOCALITIES_TABLE)
      .insert({
        nome: normalizedName,
        codigo_localidade: nextCode,
      })

    if (error) {
      console.error('Erro ao adicionar localidade:', error)
      throw error
    }
  },

  async deleteLocality(id: string): Promise<void> {
    const { error } = await supabase
      .from(LOCALITIES_TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir localidade:', error)
      throw error
    }
  },

  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    try {
      const { data, error } = await supabase
        .from(DOCUMENT_TEMPLATES_TABLE)
        .select('id, name, document_type, file_path, file_url, file_size, content_type, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar templates de documentos:', error)
        return []
      }

      if (!data) {
        return []
      }

      return (data || []).map((item) => {
        const record = item as Record<string, unknown>
        return {
          id: String(record.id),
          name: String(record.name ?? ''),
          documentType: String(record.document_type ?? ''),
          filePath: String(record.file_path ?? ''),
          fileUrl: String(record.file_url ?? ''),
          fileSize: Number(record.file_size ?? 0),
          contentType: String(record.content_type ?? ''),
          createdAt: record.created_at ? String(record.created_at) : '',
        }
      })
    } catch (error) {
      console.error('Erro inesperado ao buscar templates de documentos:', error)
      return []
    }
  },

  async uploadDocumentTemplate(params: {
    file: File
    name: string
    documentType: string
  }): Promise<DocumentTemplate> {
    const file = params.file
    const name = params.name.trim() || file.name
    const documentType = params.documentType.trim()

    if (!file) {
      throw new Error('Arquivo do template é obrigatório.')
    }

    if (!name) {
      throw new Error('Nome do template é obrigatório.')
    }

    if (!documentType) {
      throw new Error('Tipo de documento é obrigatório.')
    }

    const storage = supabase.storage.from(DOCUMENT_TEMPLATES_BUCKET)

    const path = `templates/${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await storage.upload(path, file, {
      upsert: false,
      contentType: file.type || 'application/pdf',
    })

    if (uploadError) {
      console.error('Erro ao enviar arquivo de template de documento:', uploadError)
      throw uploadError
    }

    const { data: publicUrlData } = storage.getPublicUrl(uploadData.path)

    const fileUrl = publicUrlData.publicUrl as string

    const { data, error } = await supabase
      .from(DOCUMENT_TEMPLATES_TABLE)
      .insert({
        name,
        document_type: documentType,
        file_path: uploadData.path,
        file_url: fileUrl,
        file_size: file.size,
        content_type: file.type || 'application/pdf',
      })
      .select('id, name, document_type, file_path, file_url, file_size, content_type, created_at')
      .single()

    if (error) {
      console.error('Erro ao salvar dados do template de documento:', error)
      throw error
    }

    return {
      id: String(data.id),
      name: String(data.name ?? ''),
      documentType: String(data.document_type ?? ''),
      filePath: String(data.file_path ?? ''),
      fileUrl: String(data.file_url ?? ''),
      fileSize: Number(data.file_size ?? 0),
      contentType: String(data.content_type ?? ''),
      createdAt: data.created_at ? String(data.created_at) : '',
    }
  },

  async deleteDocumentTemplate(template: DocumentTemplate): Promise<void> {
    const storage = supabase.storage.from(DOCUMENT_TEMPLATES_BUCKET)

    if (template.filePath) {
      const { error: storageError } = await storage.remove([template.filePath])

      if (storageError) {
        console.error('Erro ao remover arquivo do template de documento:', storageError)
      }
    }

    const { error } = await supabase
      .from(DOCUMENT_TEMPLATES_TABLE)
      .delete()
      .eq('id', template.id)

    if (error) {
      console.error('Erro ao excluir template de documento:', error)
      throw error
    }
  },

  async changePassword(input: PasswordChangeInput): Promise<void> {
    const { auth } = supabase

    const {
      data: { user },
      error: userError,
    } = await auth.getUser()

    if (userError) {
      console.error('Erro ao obter usuário atual:', userError)
      throw userError
    }

    if (!user?.email) {
      throw new Error('Usuário atual não possui email disponível para revalidação.')
    }

    const { error: signInError } = await auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    })

    if (signInError) {
      console.error('Erro ao validar senha atual:', signInError)
      throw signInError
    }

    const { error: updateError } = await auth.updateUser({
      password: input.newPassword,
    })

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      throw updateError
    }
  },
}
