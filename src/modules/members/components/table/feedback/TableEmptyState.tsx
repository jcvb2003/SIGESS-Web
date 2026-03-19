import { TableCell, TableRow } from "@/shared/components/ui/table";
interface TableEmptyStateProps {
  colSpan?: number;
  message?: string;
}
export function TableEmptyState({
  colSpan = 5,
  message,
}: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="px-6 py-10 text-center text-sm text-muted-foreground"
      >
        {message ?? "Nenhum sócio encontrado."}
      </TableCell>
    </TableRow>
  );
}
