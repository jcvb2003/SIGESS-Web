import { TableCell, TableRow } from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";

interface TableErrorStateProps {
  readonly colSpan?: number;
  readonly message?: string;
  readonly onRetry?: () => void;
}

export function TableErrorState({
  colSpan = 7,
  message,
  onRetry,
}: TableErrorStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="px-6 py-6 text-sm text-destructive"
      >
        {message ?? "Ocorreu um erro ao carregar os dados financeiros. Tente novamente."}
        {onRetry ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={onRetry}
          >
            Tentar novamente
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
