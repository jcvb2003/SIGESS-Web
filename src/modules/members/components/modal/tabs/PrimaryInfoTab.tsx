import { MemberRegistrationForm } from "../../../types/member.types";
import { PersonalInfoSection } from "../sections/PersonalInfoSection";
import { AddressContactSection } from "../sections/AddressContactSection";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
interface PrimaryInfoTabProps {
  member: MemberRegistrationForm;
}
export function PrimaryInfoTab({ member }: PrimaryInfoTabProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-5 pb-6 pr-3">
        <PersonalInfoSection member={member} />
        <AddressContactSection member={member} />
      </div>
    </ScrollArea>
  );
}
