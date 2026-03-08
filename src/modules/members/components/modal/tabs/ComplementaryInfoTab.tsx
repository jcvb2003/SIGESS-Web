import { MemberRegistrationForm } from "../../../types/member.types";
import { MemberDocumentsSection } from "../sections/MemberDocumentsSection";
import { MemberObservationsSection } from "../sections/MemberObservationsSection";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
interface ComplementaryInfoTabProps {
  member: MemberRegistrationForm;
}
export function ComplementaryInfoTab({ member }: ComplementaryInfoTabProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-5 pb-6 pr-3">
        <MemberDocumentsSection member={member} />
        <MemberObservationsSection member={member} />
      </div>
    </ScrollArea>
  );
}
