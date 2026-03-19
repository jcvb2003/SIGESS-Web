import { MemberStatusBadge } from "../../MemberStatusBadge";
interface MemberStatusCellProps {
  status: string | null;
}
export function MemberStatusCell({ status }: MemberStatusCellProps) {
  return (
    <div className="flex justify-center">
      <MemberStatusBadge status={status} />
    </div>
  );
}
