import { LoginForm } from '../../modules/auth/components/LoginForm'
import { AuthLayout } from '../../modules/auth/components/AuthLayout'

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
