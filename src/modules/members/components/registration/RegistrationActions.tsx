
import { Button } from "@/shared/components/ui/button"
import { Loader2, Save, X } from "lucide-react"

interface RegistrationActionsProps {
  isSubmitting: boolean
  onCancel?: () => void
  isEditMode?: boolean
}

export function RegistrationActions({ isSubmitting, onCancel, isEditMode }: RegistrationActionsProps) {
  return (
    <div className="flex items-center justify-end gap-4 pt-4">
      {onCancel && (
        <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {isEditMode ? 'Salvar Alterações' : 'Salvar Cadastro'}
          </>
        )}
      </Button>
    </div>
  )
}
