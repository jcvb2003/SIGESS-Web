
import { MemberRegistrationForm } from '../../../types/member.types'
import { MemberDocumentsSection } from '../sections/MemberDocumentsSection'
import { MemberExternalRefsSection } from '../sections/MemberExternalRefsSection'

interface ComplementaryInfoTabProps {
  member: MemberRegistrationForm
}

export function ComplementaryInfoTab({ member }: ComplementaryInfoTabProps) {
  return (
    <div className="h-[500px] pr-4 overflow-y-auto custom-scrollbar">
      <div className="space-y-6 pb-6">
        <MemberDocumentsSection member={member} />
        <MemberExternalRefsSection />
      </div>
    </div>
  )
}
