import { Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
interface MembersTableActionsProps {
  onEdit: () => void;
  onDocuments: () => void;
  onDelete: () => void;
}
export function MembersTableActions({
  onEdit,
  onDocuments,
  onDelete,
}: MembersTableActionsProps) {
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };
  return (
    <div className="flex justify-end items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
        onClick={(e) => handleAction(e, onEdit)}
        title="Editar"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        onClick={(e) => handleAction(e, onDelete)}
        title="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-purple-600 hover:text-purple-600/80 hover:bg-purple-600/10"
        onClick={(e) => handleAction(e, onDocuments)}
        title="Documentos"
      >
        <FileText className="h-4 w-4" />
      </Button>
    </div>
  );
}
