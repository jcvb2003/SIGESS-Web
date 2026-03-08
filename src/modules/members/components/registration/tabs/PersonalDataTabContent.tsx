
import { MembershipInfoForm } from "@/modules/members/components/forms/MembershipInfoForm"
import { PersonalInfoForm } from "@/modules/members/components/forms/PersonalInfoForm"
import { AddressForm } from "@/modules/members/components/forms/AddressForm"

export function PersonalDataTabContent() {
  return (
    <div className="space-y-6">
      <MembershipInfoForm />
      <PersonalInfoForm />
      <AddressForm />
    </div>
  )
}
