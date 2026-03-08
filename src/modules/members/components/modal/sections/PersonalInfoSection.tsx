import { MemberRegistrationForm } from '../../../types/member.types'

interface PersonalInfoSectionProps {
  member: MemberRegistrationForm
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium break-words">{value || '-'}</p>
    </div>
  )
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-'
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateString
}

export function PersonalInfoSection({ member }: PersonalInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Dados Pessoais</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <InfoItem label="Apelido" value={member.apelido} />
        <InfoItem label="Data de Nascimento" value={formatDate(member.dataDeNascimento)} />
        <InfoItem label="Sexo" value={member.sexo} />
        <InfoItem label="Estado Civil" value={member.estadoCivil} />
        <InfoItem label="Nacionalidade" value={member.nacionalidade} />
        <InfoItem label="Naturalidade" value={`${member.naturalidade}${member.ufNaturalidade ? '/' + member.ufNaturalidade : ''}`} />
        <InfoItem label="Nome do Pai" value={member.pai} />
        <InfoItem label="Nome da Mãe" value={member.mae} />
        <InfoItem label="Alfabetizado" value={member.alfabetizado} />
        <InfoItem label="Escolaridade" value="-" /> {/* Campo não presente no form atual, mas comum */}
      </div>
    </div>
  )
}
