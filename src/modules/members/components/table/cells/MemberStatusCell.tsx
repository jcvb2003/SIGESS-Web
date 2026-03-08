import { MemberStatusBadge } from '../../MemberStatusBadge'

interface MemberStatusCellProps {
  status: string | null
}

export function MemberStatusCell({ status }: MemberStatusCellProps) {
  return <MemberStatusBadge status={status} />
}
