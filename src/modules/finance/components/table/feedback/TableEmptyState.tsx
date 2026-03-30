import { TableCell, TableRow } from "@/shared/components/ui/table";

interface TableEmptyStateProps {
  readonly colSpan?: number;
  readonly message?: string;
}

export function TableEmptyState({
  colSpan = 7,
  message,
}: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="px-6 py-10 text-center text-sm text-muted-foreground"
      >
        {message ?? "Nenhum registro encontrado."}
      </TableCell>
    </TableRow>
  );
}
