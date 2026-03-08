import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContextStore'
import { LoginCredentials } from '../types/auth.types'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      await signIn(credentials)
      navigate('/dashboard')
    } catch (error) {
      // Error is handled in AuthContext (toast)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    loading,
  }
}
