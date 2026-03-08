interface MemberCpfCellProps {
  cpf: string | null;
}
const formatCpf = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) {
    return value;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};
export function MemberCpfCell({ cpf }: MemberCpfCellProps) {
  return (
    <span className="font-medium text-xs md:text-sm whitespace-nowrap">
      {formatCpf(cpf)}
    </span>
  );
}
