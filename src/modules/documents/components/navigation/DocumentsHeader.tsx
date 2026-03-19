import { MemberInfoBar } from "../member-selector/MemberInfoBar";
export function DocumentsHeader() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Emissão de Documentos
          </h1>
          <p className="text-muted-foreground">
            Selecione um sócio para gerar requerimentos e declarações.
          </p>
        </div>
      </div>
      <MemberInfoBar />
    </div>
  );
}
