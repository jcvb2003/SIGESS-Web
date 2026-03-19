import { TableCell, TableRow } from "@/shared/components/ui/table";
import { MemberBasicInfoCell } from "./cells/MemberBasicInfoCell";
import { MemberCpfCell } from "./cells/MemberCpfCell";
import { MemberDateCell } from "./cells/MemberDateCell";
import { MemberStatusCell } from "./cells/MemberStatusCell";
import { MembersTableActions } from "./MembersTableActions";
import type { MemberListItem } from "../../types/member.types";
import { useLocalitiesData } from "../../hooks/data/useLocalitiesData";
interface MembersTableRowProps {
  member: MemberListItem;
  onView: (member: MemberListItem) => void;
  onEdit: (member: MemberListItem) => void;
  onDocuments: (member: MemberListItem) => void;
  onDelete: (member: MemberListItem) => void;
}
export function MembersTableRow({
  member,
  onView,
  onEdit,
  onDocuments,
  onDelete,
}: MembersTableRowProps) {
  const { localities } = useLocalitiesData();
  const localityName =
    localities.find((l) => l.code === member.codigo_localidade)?.name || "-";
  return (
    <TableRow
      key={member.id}
      className="group cursor-pointer hover:bg-muted/50"
      onClick={() => onView(member)}
    >
      <TableCell className="px-1 py-1 md:px-6 md:py-4">
        <MemberBasicInfoCell name={member.nome} code={member.codigo_do_socio} />
      </TableCell>
      <TableCell className="px-1 py-1 md:px-6 md:py-4">
        <MemberCpfCell cpf={member.cpf} />
      </TableCell>
      <TableCell className="px-1 py-1 md:px-6 md:py-4 whitespace-nowrap">
        <span className="text-sm text-muted-foreground">{localityName}</span>
      </TableCell>
      <TableCell className="px-1 py-1 md:px-6 md:py-4">
        <MemberDateCell value={member.data_de_admissao} />
      </TableCell>
      <TableCell className="px-1 py-1 md:px-6 md:py-4">
        <MemberStatusCell status={member.situacao} />
      </TableCell>
      <TableCell className="text-right px-1 py-1 md:px-6 md:py-4">
        <MembersTableActions
          onEdit={() => onEdit(member)}
          onDocuments={() => onDocuments(member)}
          onDelete={() => onDelete(member)}
        />
      </TableCell>
    </TableRow>
  );
}
