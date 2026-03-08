import { settingsService } from '@/modules/settings/services/settingsService'
import { supabase } from '@/shared/lib/supabase/client'
import { LocalityOption, MemberRegistrationForm, MemberSearchParams, MembersResult } from '../types/member.types'
import { toMemberInsertPayload, fromMemberRecord } from './memberDataTransformer'

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

export class DuplicateCpfError extends Error {
  code = 'DUPLICATE_CPF'
  constructor(message = 'CPF já cadastrado.') {
    super(message)
    this.name = 'DuplicateCpfError'
  }
}

export const memberService = {
  async create(input: MemberRegistrationForm): Promise<void> {
    const payload = toMemberInsertPayload(input)

    const { error } = await supabase.from('socios').insert(payload)

    if (error) {
      const message = String(error.message || '')
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code ?? '')
          : ''
      const isDuplicate =
        code === '23505' ||
        /duplicate key value/i.test(message) ||
        /unique/i.test(message) && /cpf/i.test(message)

      if (isDuplicate) {
        throw new DuplicateCpfError()
      }

      throw error
    }
  },
  async searchMembers(params: MemberSearchParams): Promise<MembersResult> {
    const { page, pageSize, searchTerm, statusFilter, localityCode, birthMonth, gender, rgpStatus } = params

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('socios')
      .select('id, codigo_do_socio, nome, cpf, data_de_admissao, situacao, codigo_localidade, data_de_nascimento', {
        count: 'exact',
      })

    const term = searchTerm.trim()

    if (term) {
      const like = `%${term}%`
      query = query.or(`nome.ilike.${like},cpf.ilike.${like},codigo_do_socio.ilike.${like}`)
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('situacao', statusFilter)
    }

    if (localityCode && localityCode !== 'all') {
      query = query.eq('codigo_localidade', localityCode)
    }

    if (gender && gender !== 'all') {
      query = query.eq('sexo', gender)
    }

    if (rgpStatus === 'with_rgp') {
      // Fixed: Using emb_rgp instead of rgp based on database schema
      query = query.not('emb_rgp', 'is', null).neq('emb_rgp', '').not('emissao_rgp', 'is', null)
    } else if (rgpStatus === 'without_rgp') {
      // Inverse logic: either emb_rgp is null/empty OR emissao_rgp is null
      query = query.or('emb_rgp.is.null,emb_rgp.eq.,emissao_rgp.is.null')
    }

    // If birthMonth is present, we need to filter in memory because ilike on date column fails
    // and we want to avoid creating DB functions.
    if (birthMonth) {
      const { data, error } = await query.order('nome', { ascending: true })

      if (error) {
        throw error
      }

      const month = birthMonth.padStart(2, '0')
      
      const filteredItems = (data || []).filter((item) => {
        const record = item as Record<string, unknown>
        const dob = record.data_de_nascimento
        
        if (!dob || typeof dob !== 'string') return false
        
        // Assuming format YYYY-MM-DD which contains -MM-
        return dob.includes(`-${month}-`)
      })

      const total = filteredItems.length
      const pagedItems = filteredItems.slice(from, to + 1)

      const items = pagedItems.map((item) => {
        const record = item as Record<string, unknown>
        return {
          id: String(record.id),
          codigo_do_socio: toNullableString(record.codigo_do_socio),
          nome: toNullableString(record.nome),
          cpf: toNullableString(record.cpf),
          data_de_admissao: toNullableString(record.data_de_admissao),
          situacao: toNullableString(record.situacao),
          codigo_localidade: toNullableString(record.codigo_localidade),
        }
      })

      return {
        items,
        total,
      }
    }

    // Normal execution with server-side pagination
    const { data, error, count } = await query.order('nome', { ascending: true }).range(from, to)

    if (error) {
      throw error
    }

    const items = (data || []).map((item) => {
      const record = item as Record<string, unknown>
      return {
        id: String(record.id),
        codigo_do_socio: toNullableString(record.codigo_do_socio),
        nome: toNullableString(record.nome),
        cpf: toNullableString(record.cpf),
        data_de_admissao: toNullableString(record.data_de_admissao),
        situacao: toNullableString(record.situacao),
        codigo_localidade: toNullableString(record.codigo_localidade),
      }
    })

    return {
      items,
      total: count ?? items.length,
    }
  },
  async deleteMember(id: string): Promise<void> {
    const { error } = await supabase.from('socios').delete().eq('id', id)

    if (error) {
      throw error
    }
  },
  async getLocalities(): Promise<LocalityOption[]> {
    const localities = await settingsService.getLocalities()

    return localities.map((item) => ({
      code: item.code ? String(item.code) : '',
      name: String(item.name ?? ''),
    }))
  },

  async getLastRegistrationNumber(prefix: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('socios')
      .select('codigo_do_socio')
      .ilike('codigo_do_socio', `${prefix}%`)
      .order('codigo_do_socio', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching last registration number:', error)
      return null
    }

    if (data && data.length > 0) {
      return data[0].codigo_do_socio ? String(data[0].codigo_do_socio) : null
    }

    return null
  },

  async getMemberById(id: string): Promise<MemberRegistrationForm | null> {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching member:', error)
      return null
    }

    if (!data) return null

    return fromMemberRecord(data)
  },

  async updateMember(id: string, member: MemberRegistrationForm): Promise<void> {
    const payload = toMemberInsertPayload(member)
    const { error } = await supabase
      .from('socios')
      .update(payload)
      .eq('id', id)

    if (error) {
      throw error
    }
  },
}
