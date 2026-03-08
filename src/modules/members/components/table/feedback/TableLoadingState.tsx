import { TableCell, TableRow } from "@/shared/components/ui/table";
interface TableLoadingStateProps {
  colSpan?: number;
  message?: string;
}
export function TableLoadingState({
  colSpan = 5,
  message,
}: TableLoadingStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="px-6 py-6 text-sm text-muted-foreground"
      >
        {message ?? "Carregando sócios..."}
      </TableCell>
    </TableRow>
  );
}
