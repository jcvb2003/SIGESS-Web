import { useEffect, useState, useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { MemberRegistrationSchemaType } from '../../schemas/memberRegistration.schema'
import { memberService } from '../../services/memberService'

export function useRegistrationNumber(
  form: UseFormReturn<MemberRegistrationSchemaType>,
  isEditing: boolean = false
) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRegistrationNumber = useCallback(async (birthdate: string) => {
    if (!birthdate || birthdate.length < 10) return

    try {
      setIsGenerating(true)
      // Extrai o mês da data (YYYY-MM-DD)
      // birthdate[5] e [6] correspondem ao mês
      const month = birthdate.substring(5, 7)
      const prefix = `${month}0`
      
      const lastNumber = await memberService.getLastRegistrationNumber(prefix)
      
      let sequenceNumber = 1
      if (lastNumber) {
        // Formato esperado: MM0XXX (ex: 120001)
        // Pega os últimos 3 dígitos
        const sequencePart = lastNumber.substring(3)
        const parsed = parseInt(sequencePart || '0', 10)
        if (!isNaN(parsed)) {
          sequenceNumber = parsed + 1
        }
      }

      const formattedSequence = sequenceNumber.toString().padStart(3, '0')
      const newRegistrationNumber = `${prefix}${formattedSequence}`
      
      form.setValue('codigoDoSocio', newRegistrationNumber, { 
        shouldValidate: true,
        shouldDirty: true 
      })
      
      toast.info(`Número de registro sugerido: ${newRegistrationNumber}`)
    } catch (error) {
      console.error('Erro ao gerar número de registro:', error)
      toast.error("Não foi possível gerar o número de registro automaticamente.")
    } finally {
      setIsGenerating(false)
    }
  }, [form])

  useEffect(() => {
    if (isEditing) return

    const subscription = form.watch((value, { name }) => {
      if (name === 'dataDeNascimento' && value.dataDeNascimento?.length === 10) {
        const currentCode = form.getValues('codigoDoSocio')
        if (!currentCode) {
           generateRegistrationNumber(value.dataDeNascimento)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form, isEditing, generateRegistrationNumber])

  return {
    isGenerating,
    generateRegistrationNumber
  }
}
