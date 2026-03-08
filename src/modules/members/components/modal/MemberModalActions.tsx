import { Button } from '@/shared/components/ui/button'
import { Pencil, Trash2, FileText } from 'lucide-react'

interface MemberModalActionsProps {
  onEdit: () => void
  onDelete: () => void
  onDocuments: () => void
}

export function MemberModalActions({ onEdit, onDelete, onDocuments }: MemberModalActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4 justify-end">
      <Button variant="outline" onClick={onDocuments}>
        <FileText className="mr-2 h-4 w-4" />
        Documentos
      </Button>
      
      <Button variant="outline" onClick={onEdit}>
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </Button>
      
      <Button variant="destructive" onClick={onDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    </div>
  )
}
