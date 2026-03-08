import { MembershipInfoForm } from "@/modules/members/components/forms/MembershipInfoForm";
import { PersonalInfoForm } from "@/modules/members/components/forms/PersonalInfoForm";
import { AddressForm } from "@/modules/members/components/forms/AddressForm";
interface PersonalDataTabContentProps {
  isEditMode: boolean;
}

export function PersonalDataTabContent({ isEditMode }: Readonly<PersonalDataTabContentProps>) {
  return (
    <div className="space-y-6">
      <MembershipInfoForm isEditMode={isEditMode} />
      <PersonalInfoForm />
      <AddressForm />
    </div>
  );
}
