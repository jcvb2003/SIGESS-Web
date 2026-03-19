interface MemberDateCellProps {
  value: string | null;
}
const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};
export function MemberDateCell({ value }: MemberDateCellProps) {
  return (
    <span className="text-muted-foreground text-xs md:text-sm">
      {formatDate(value)}
    </span>
  );
}
