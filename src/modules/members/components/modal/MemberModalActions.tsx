import { Button } from "@/shared/components/ui/button";
import { Pencil, Trash2, FileText, Wallet } from "lucide-react";

interface MemberModalActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onDocuments: () => void;
  onFinance: () => void;
  variant?: "desktop" | "mobile";
}

export function MemberModalActions({
  onEdit,
  onDelete,
  onDocuments,
  onFinance,
  variant = "desktop",
}: MemberModalActionsProps) {
  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 border-border/50 hover:border-primary/30 transition-all"
            onClick={onDocuments}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 border-border/50 hover:border-primary/30 transition-all"
            onClick={onFinance}
          >
            <Wallet className="mr-2 h-4 w-4 text-emerald-500" />
            Financeiro
          </Button>
        </div>
        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 border-border/50 hover:border-primary/30 transition-all"
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 h-10"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-border/50 hover:border-primary/30 transition-all hover:bg-accent"
        onClick={onDocuments}
      >
        <FileText className="mr-2 h-4 w-4" />
        Documentos
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-border/50 hover:border-primary/30 transition-all hover:bg-accent"
        onClick={onFinance}
      >
        <Wallet className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        Financeiro
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-border/50 hover:border-primary/30 transition-all hover:bg-accent"
        onClick={onEdit}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="h-9"
        onClick={onDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    </div>
  );
}

