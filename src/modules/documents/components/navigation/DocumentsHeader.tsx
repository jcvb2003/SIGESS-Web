import { MemberInfoBar } from "../member-selector/MemberInfoBar";
import { PageHeader } from "@/shared/components/layout/PageHeader";

export function DocumentsHeader() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Emissão de Documentos"
        description="Selecione um sócio para gerar requerimentos e declarações."
      />
      <MemberInfoBar />
    </div>
  );
}
