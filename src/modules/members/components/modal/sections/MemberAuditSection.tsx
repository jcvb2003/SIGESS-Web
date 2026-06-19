import { MemberRegistrationForm } from "../../../types/member.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { History } from "lucide-react";
import { InfoItem } from "../shared/InfoItem";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";

interface MemberAuditSectionProps {
  member: MemberRegistrationForm;
}

export function MemberAuditSection({ member }: Readonly<MemberAuditSectionProps>) {
  if (!member.createdAt && !member.updatedAt && !member.createdByName && !member.updatedByName) {
    return null;
  }

  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <History className="h-4.5 w-4.5 text-primary/70" />
          Auditoria do cadastro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <InfoItem label="Criado por" value={member.createdByName} />
          <InfoItem
            label="Criado em"
            value={member.createdAt ? formatDate(member.createdAt, "dd/MM/yyyy 'às' HH:mm") : ""}
          />
          <InfoItem label="Última alteração por" value={member.updatedByName} />
          <InfoItem
            label="Última alteração em"
            value={member.updatedAt ? formatDate(member.updatedAt, "dd/MM/yyyy 'às' HH:mm") : ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}
