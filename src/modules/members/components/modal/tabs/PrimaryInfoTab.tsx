
import { MemberRegistrationForm } from '../../../types/member.types'
import { PersonalInfoSection } from '../sections/PersonalInfoSection'
import { AddressContactSection } from '../sections/AddressContactSection'

interface PrimaryInfoTabProps {
  member: MemberRegistrationForm
}

export function PrimaryInfoTab({ member }: PrimaryInfoTabProps) {
  return (
    <div className="h-[500px] pr-4 overflow-y-auto custom-scrollbar">
      <div className="space-y-6 pb-6">
        <PersonalInfoSection member={member} />
        <AddressContactSection member={member} />
      </div>
    </div>
  )
}
