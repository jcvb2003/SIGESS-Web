
import { useState, FormEvent, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/shared/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  MemberRegistrationForm,
  initialMemberRegistrationForm,
} from '../../types/member.types'
import { DuplicateCpfError, memberService } from '../../services/memberService'
import { memberRegistrationSchema, MemberRegistrationSchemaType } from '../../schemas/memberRegistration.schema'
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary'
import { RegistrationTabs } from './RegistrationTabs'
import { RegistrationActions } from './RegistrationActions'
import { useNavigate } from 'react-router-dom'

interface RegistrationFormProps {
  onSuccess?: () => void
  initialData?: MemberRegistrationForm
  memberId?: string
}

export function RegistrationForm({ onSuccess, initialData, memberId }: RegistrationFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const isEditMode = !!memberId
  
  const form = useForm<MemberRegistrationSchemaType>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: initialData || initialMemberRegistrationForm,
    mode: 'onChange' 
  })

  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  const { isSubmitting } = form.formState

  const onSubmit = async (data: MemberRegistrationSchemaType) => {
    try {
      // Conversão de tipos para compatibilidade com o serviço existente
      const payload = data as MemberRegistrationForm
      
      if (isEditMode && memberId) {
        await memberService.updateMember(memberId, payload)
        toast.success('Sócio atualizado com sucesso.')
      } else {
        await memberService.create(payload)
        toast.success('Sócio cadastrado com sucesso.')
      }

      form.reset(initialMemberRegistrationForm)
      onSuccess?.()
      // Redirecionar para a lista de membros após sucesso
      navigate('/members')
    } catch (err: unknown) {
      const errorCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code ?? '')
          : ''
      if (err instanceof DuplicateCpfError || errorCode === 'DUPLICATE_CPF') {
        toast.error('Já existe um cadastro com este CPF.')
        form.setError('cpf', { type: 'manual', message: 'CPF já cadastrado' })
      } else {
        toast.error('Não foi possível salvar o cadastro. Tente novamente.')
        console.error(err)
      }
    } finally {
      setConfirmOpen(false)
    }
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    form.handleSubmit(() => setConfirmOpen(true))()
  }

  const handleConfirmSubmit = () => {
    form.handleSubmit(onSubmit)()
  }

  const handleCancel = () => {
      navigate('/members')
  }

  return (
    <ErrorBoundary>
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <RegistrationTabs />
          
          <RegistrationActions 
            isSubmitting={isSubmitting} 
            onCancel={handleCancel}
            isEditMode={isEditMode}
          />
        </form>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isEditMode ? 'Confirmar alterações?' : 'Confirmar cadastro?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isEditMode 
                  ? 'Deseja realmente salvar as alterações realizadas no cadastro deste sócio?'
                  : 'Deseja realmente salvar o cadastro deste novo sócio? Verifique se todos os dados estão corretos.'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSubmit} disabled={isSubmitting}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Form>
    </ErrorBoundary>
  )
}
