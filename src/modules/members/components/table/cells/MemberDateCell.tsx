import { formatDateOrDash } from "@/shared/utils/date";

interface MemberDateCellProps {
  value: string | null;
}

export function MemberDateCell({ value }: MemberDateCellProps) {
  return (
    <span className="text-muted-foreground text-xs md:text-sm">
      {formatDateOrDash(value)}
    </span>
  );
}
