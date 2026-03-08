import { supabase } from '@/shared/lib/supabase/client'

interface Member {
  id: string
  nome: string
  created_at?: string
  data_de_admissao?: string
  data_de_nascimento?: string
  fotos?: { url: string }[] | null
}

export const dashboardService = {
  async getStats() {
    try {
      
      const [
        totalResponse,
        maleResponse,
        femaleResponse,
        documentsResponse
      ] = await Promise.all([
        supabase.from('socios').select('*', { count: 'exact', head: true }),
        supabase.from('socios').select('*', { count: 'exact', head: true }).eq('sexo', 'MASCULINO'),
        supabase.from('socios').select('*', { count: 'exact', head: true }).eq('sexo', 'FEMININO'),
        supabase.from('req_inss').select('*', { count: 'exact', head: true })
      ])

      return {
        totalMembers: totalResponse.count || 0,
        maleMembers: maleResponse.count || 0,
        femaleMembers: femaleResponse.count || 0,
        totalDocuments: documentsResponse.count || 0
      }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return {
        totalMembers: 0,
        maleMembers: 0,
        femaleMembers: 0,
        totalDocuments: 0
      }
    }
  },

  async getRecentMembers(): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('id, nome, data_de_admissao')
        .order('data_de_admissao', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching recent members:', error)
        return []
      }
      
      return (data || []) as unknown as Member[]
    } catch (error) {
      console.error('Recent members error:', error)
      return []
    }
  },

  async getBirthdayMembers(): Promise<Member[]> {
    try {
      const today = new Date()
      const currentMonth = today.getMonth() + 1 // 1-12
      const currentDay = today.getDate()

      const { data, error } = await supabase
        .from('socios')
        .select('id, nome, data_de_nascimento')
        .not('data_de_nascimento', 'is', null)
        
      if (error) {
        console.error('Error fetching birthday members:', error)
        return []
      }

      const typedData = (data || []) as unknown as Member[]

      return typedData
        .filter(member => {
          if (!member.data_de_nascimento) return false
          const parts = member.data_de_nascimento.split('-')
          if (parts.length !== 3) return false
          
          const month = parseInt(parts[1], 10)
          const day = parseInt(parts[2], 10)
          
          return month === currentMonth && day === currentDay
        })
        .sort((a, b) => {
          return a.nome.localeCompare(b.nome)
        })
    } catch (error) {
      console.error('Birthday members error:', error)
      return []
    }
  }
}
