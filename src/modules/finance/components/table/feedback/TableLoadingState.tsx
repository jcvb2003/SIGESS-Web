import { useMemo } from "react";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface TableLoadingStateProps {
  readonly colSpan?: number;
  readonly rows?: number;
}

export function TableLoadingState({
  colSpan = 7,
  rows = 5,
}: TableLoadingStateProps) {
  const skeletonIds = useMemo(() => Array.from({ length: rows }).map((_, i) => String(i)), [rows]);

  return (
    <>
      {skeletonIds.map((id) => (
        <TableRow key={`loading-finance-${id}`}>
          <TableCell colSpan={colSpan} className="p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
