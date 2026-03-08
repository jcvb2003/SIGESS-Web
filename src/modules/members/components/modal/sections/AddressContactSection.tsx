import { MemberRegistrationForm } from "../../../types/member.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { MapPin } from "lucide-react";
import { InfoItem } from "../shared/InfoItem";
interface AddressContactSectionProps {
  member: MemberRegistrationForm;
}
export function AddressContactSection({ member }: AddressContactSectionProps) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-4.5 w-4.5 text-primary/70" />
          Endereço e Contato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <InfoItem label="Endereço" value={member.endereco} />
          <InfoItem label="Número" value={member.numero} />
          <InfoItem label="Bairro" value={member.bairro} />
          <InfoItem label="Cidade" value={member.cidade} />
          <InfoItem label="UF" value={member.uf} />
          <InfoItem label="CEP" value={member.cep} />
          <InfoItem label="Telefone" value={member.telefone} />
          <InfoItem label="Email" value={member.email} />
        </div>
      </CardContent>
    </Card>
  );
}
