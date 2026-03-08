import { MemberRegistrationForm } from "../../../types/member.types";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { UserCircle } from "lucide-react";
import { InfoItem } from "../shared/InfoItem";
interface PersonalInfoSectionProps {
  member: MemberRegistrationForm;
}
export function PersonalInfoSection({ member }: PersonalInfoSectionProps) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <UserCircle className="h-4.5 w-4.5 text-primary/70" />
          Dados Pessoais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <InfoItem label="Apelido" value={member.apelido} />
          <InfoItem
            label="Data de Nascimento"
            value={formatDate(member.dataDeNascimento)}
          />
          <InfoItem label="Sexo" value={member.sexo} />
          <InfoItem label="Estado Civil" value={member.estadoCivil} />
          <InfoItem label="Nacionalidade" value={member.nacionalidade} />
          <InfoItem
            label="Naturalidade"
            value={`${member.naturalidade}${member.ufNaturalidade ? "/" + member.ufNaturalidade : ""}`}
          />
          <InfoItem label="Nome do Pai" value={member.pai} />
          <InfoItem label="Nome da Mãe" value={member.mae} />
          <InfoItem label="Alfabetizado" value={member.alfabetizado} />
          <InfoItem label="Escolaridade" value={member.escolaridade} />
        </div>
      </CardContent>
    </Card>
  );
}
