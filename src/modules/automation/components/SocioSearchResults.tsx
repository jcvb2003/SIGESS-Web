import { cn } from "@/shared/lib/utils";
import type { GovBatchSearchResult } from "@/modules/automation/services/reapBulkAutomationService";

interface SocioSearchResultsProps {
  readonly resultados: GovBatchSearchResult[];
  readonly selectedCpfs: string[];
  readonly maxSocios: number;
  readonly onAddSocio: (socio: GovBatchSearchResult) => void;
}

export function SocioSearchResults({
  resultados,
  selectedCpfs,
  maxSocios,
  onAddSocio,
}: Readonly<SocioSearchResultsProps>) {
  return (
    <div className="max-h-48 divide-y overflow-y-auto rounded-md border bg-popover shadow-md">
      {resultados.map((resultado) => {
        const cpf = resultado.cpf || "";
        const jaSelecionado = cpf ? selectedCpfs.includes(cpf) : false;
        const limiteAtingido = selectedCpfs.length >= maxSocios;
        const semCpf = !cpf;

        return (
          <button
            key={`${resultado.cpf || "sem-cpf"}-${resultado.nome || "sem-nome"}`}
            type="button"
            onClick={() => onAddSocio(resultado)}
            disabled={jaSelecionado || limiteAtingido || semCpf}
            className={cn(
              "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              (jaSelecionado || limiteAtingido || semCpf) &&
                "cursor-not-allowed opacity-40",
            )}
          >
            <p className="font-medium">{resultado.nome}</p>
            <p className="text-xs text-muted-foreground">
              {resultado.cpf || "CPF não informado"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
