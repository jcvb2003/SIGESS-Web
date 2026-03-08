import { supabase } from '@/shared/lib/supabase/client'
import type { DocumentListItem, DocumentSearchParams, DocumentsResult } from '../types/document.types'

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

export const documentService = {
  async listRequests(params: DocumentSearchParams): Promise<DocumentsResult> {
    const { page, pageSize, searchTerm } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('req_inss')
      .select('id, cod_req_inss, data, codigo_do_socio, nome, cpf, situacao_mpa', { count: 'exact' })

    const term = searchTerm.trim()

    if (term) {
      const like = `%${term}%`
      query = query.or(
        `nome.ilike.${like},cpf.ilike.${like},codigo_do_socio.ilike.${like},cod_req_inss.ilike.${like}`
      )
    }

    const { data, error, count } = await query
      .order('data', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const items = (data || []).map((item) => {
      const record = item as Record<string, unknown>
      const mapped: DocumentListItem = {
        id: String(record.id),
        cod_req_inss: toNullableString(record.cod_req_inss),
        data: toNullableString(record.data),
        codigo_do_socio: toNullableString(record.codigo_do_socio),
        nome: toNullableString(record.nome),
        cpf: toNullableString(record.cpf),
        situacao_mpa: toNullableString(record.situacao_mpa),
      }
      return mapped
    })

    return {
      items,
      total: count ?? items.length,
    }
  },
}
