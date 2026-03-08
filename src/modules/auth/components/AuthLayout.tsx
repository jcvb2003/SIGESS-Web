import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">SIGESS</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistema de Gestão para Sindicatos de Pescadores Artesanais
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
