import { MoreHorizontal, Pencil, Trash2, FileText, Eye } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'

interface MembersTableActionsProps {
  onView: () => void
  onEdit: () => void
  onDocuments: () => void
  onDelete: () => void
}

export function MembersTableActions({ onView, onEdit, onDocuments, onDelete }: MembersTableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px] rounded-xl">
        <DropdownMenuItem className="cursor-pointer" onClick={onView}>
          <Eye className="mr-2 h-4 w-4" /> Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onDocuments}>
          <FileText className="mr-2 h-4 w-4" /> Documentos
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
