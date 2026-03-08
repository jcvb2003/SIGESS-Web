import { MemberRegistrationForm } from '../../../types/member.types'

interface MemberDocumentsSectionProps {
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

export function MemberDocumentsSection({ member }: MemberDocumentsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Documentos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <InfoItem label="CPF" value={member.cpf} />
        <InfoItem label="RG" value={member.rg} />
        <InfoItem label="Órgão Emissor/UF" value={member.ufRg} />
        <InfoItem label="Data Expedição RG" value={formatDate(member.dataExpedicaoRg)} />
        <InfoItem label="Título de Eleitor" value={member.tituloEleitor} />
        <InfoItem label="Zona Eleitoral" value={member.zonaEleitoral} />
        <InfoItem label="Seção Eleitoral" value={member.secaoEleitoral} />
        <InfoItem label="CAEPF" value={member.caepf} />
        <InfoItem label="PIS" value={member.pis} />
        <InfoItem label="CEI" value={member.cei} />
        <InfoItem label="NIT" value={member.nit} />
        <InfoItem label="RGP" value={member.rgp} />
        <InfoItem label="Emissão RGP" value={formatDate(member.emissaoRgp)} />
        <InfoItem label="UF RGP" value={member.ufRgp} />
      </div>
    </div>
  )
}
