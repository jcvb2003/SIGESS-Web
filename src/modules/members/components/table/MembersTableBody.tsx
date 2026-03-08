import { TableBody } from "@/shared/components/ui/table";
import { TableEmptyState } from "./feedback/TableEmptyState";
import { TableErrorState } from "./feedback/TableErrorState";
import { TableLoadingState } from "./feedback/TableLoadingState";
import { MembersTableRow } from "./MembersTableRow";
import type { MemberListItem } from "../../types/member.types";
interface MembersTableBodyProps {
  members: MemberListItem[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  onView: (member: MemberListItem) => void;
  onEdit: (member: MemberListItem) => void;
  onDocuments: (member: MemberListItem) => void;
  onDelete: (member: MemberListItem) => void;
}
export function MembersTableBody({
  members,
  isLoading,
  isFetching,
  error,
  onRetry,
  onView,
  onEdit,
  onDocuments,
  onDelete,
}: MembersTableBodyProps) {
  return (
    <TableBody>
      {isLoading || isFetching ? (
        <TableLoadingState />
      ) : error ? (
        <TableErrorState onRetry={onRetry} />
      ) : members.length === 0 ? (
        <TableEmptyState />
      ) : (
        members.map((member) => (
          <MembersTableRow
            key={member.id}
            member={member}
            onView={onView}
            onEdit={onEdit}
            onDocuments={onDocuments}
            onDelete={onDelete}
          />
        ))
      )}
    </TableBody>
  );
}
