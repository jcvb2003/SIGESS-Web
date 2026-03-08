import { supabase } from '@/shared/lib/supabase/client'
import { LoginCredentials } from '../types/auth.types'

export const authService = {
  async signIn({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw error
    }
    return data
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      throw error
    }
    return data
  },
}
