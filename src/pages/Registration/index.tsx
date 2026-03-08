import { useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { RegistrationForm } from '@/modules/members/components/registration/RegistrationForm'

export default function Registration() {
  const navigate = useNavigate()

  const handleBackToMembers = () => {
    navigate('/members')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cadastro de Sócio</h1>
            <p className="text-muted-foreground text-sm">
              Preencha os dados do sócio com as mesmas informações do sistema anterior.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          type="button"
          onClick={handleBackToMembers}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>
      </div>

      <RegistrationForm />
    </div>
  )
}
