import { useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase/client'
import { authService } from '../services/authService'
import type { LoginCredentials } from '../types/auth.types'
import { toast } from 'sonner'
import { AuthContext } from './authContextStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { session } = await authService.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (credentials: LoginCredentials) => {
    try {
      await authService.signIn(credentials)
      toast.success('Login realizado com sucesso!')
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao realizar login'
      console.error('Login error:', error)
      toast.error(message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      toast.success('Logout realizado com sucesso!')
    } catch (error: unknown) {
      console.error('Logout error:', error)
      toast.error('Erro ao realizar logout')
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
