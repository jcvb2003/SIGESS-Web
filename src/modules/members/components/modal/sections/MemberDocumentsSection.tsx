import { MemberRegistrationForm } from "../../../types/member.types";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { FileText } from "lucide-react";
import { InfoItem } from "../shared/InfoItem";
interface MemberDocumentsSectionProps {
  readonly member: MemberRegistrationForm;
}
export function MemberDocumentsSection({
  member,
}: MemberDocumentsSectionProps) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileText className="h-4.5 w-4.5 text-primary/70" />
          Documentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <InfoItem label="RG" value={member.rg} />
          <InfoItem label="Órgão Emissor/UF" value={member.ufRg} />
          <InfoItem
            label="Data Expedição RG"
            value={formatDate(member.dataExpedicaoRg)}
          />
          <InfoItem label="Título de Eleitor" value={member.tituloEleitor} />
          <InfoItem label="Zona Eleitoral" value={member.zonaEleitoral} />
          <InfoItem label="Seção Eleitoral" value={member.secaoEleitoral} />
          <InfoItem label="CAEPF" value={member.caepf} />
          <InfoItem label="CEI" value={member.cei} />
          <InfoItem label="NIS/NIT/PIS" value={member.nit} />
          <InfoItem label="RGP" value={member.rgp} />
          <InfoItem label="Tipo RGP" value={member.tipoRgp} />
          <InfoItem label="Emissão RGP" value={formatDate(member.emissaoRgp)} />
          <InfoItem label="UF RGP" value={member.ufRgp} />
        </div>
      </CardContent>
    </Card>
  );
}
