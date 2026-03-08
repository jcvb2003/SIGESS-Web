import { MemberRegistrationForm } from '../../../types/member.types'

interface AddressContactSectionProps {
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

export function AddressContactSection({ member }: AddressContactSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-lg font-semibold border-b pb-2">Endereço e Contato</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <InfoItem label="Endereço" value={member.endereco} />
        <InfoItem label="Número" value={member.numero} />
        <InfoItem label="Bairro" value={member.bairro} />
        <InfoItem label="Cidade" value={member.cidade} />
        <InfoItem label="UF" value={member.uf} />
        <InfoItem label="CEP" value={member.cep} />
        <InfoItem label="Telefone" value={member.telefone} />
        <InfoItem label="Email" value={member.email} />
        <InfoItem label="Localidade (Cód.)" value={member.codigoLocalidade} />
      </div>
    </div>
  )
}
