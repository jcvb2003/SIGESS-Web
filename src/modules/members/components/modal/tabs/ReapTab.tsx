import { useReapDetail } from "@/modules/reap/hooks/data/useReapData";
import { ReapStatusBadge } from "@/modules/reap/components/ReapStatusBadge";
import { ANOS_SIMPLIFICADO, ANO_INICIAL_ANUAL, ANO_ATUAL } from "@/modules/reap/types/reap.types";
import { Badge } from "@/shared/components/ui/badge";
import { Loader2, ClipboardList } from "lucide-react";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface ReapTabProps {
  cpf: string | null;
  emissaoRgp?: string | null;
}

function getAnosObrigatoriosSimplificado(emissaoRgp: string | null): number[] {
  if (!emissaoRgp) return [...ANOS_SIMPLIFICADO];
  const anoRgp = new Date(emissaoRgp).getFullYear();
  return ANOS_SIMPLIFICADO.filter((ano) => ano >= anoRgp);
}

function getAnosObrigatoriosAnual(emissaoRgp: string | null): number[] {
  const anoInicio = emissaoRgp
    ? Math.max(new Date(emissaoRgp).getFullYear(), ANO_INICIAL_ANUAL)
    : ANO_INICIAL_ANUAL;
  const anos: number[] = [];
  for (let a = anoInicio; a <= ANO_ATUAL - 1; a++) {
    anos.push(a);
  }
  return anos;
}

export function ReapTab({ cpf, emissaoRgp }: Readonly<ReapTabProps>) {
  const { reap, isLoading } = useReapDetail(cpf);

  if (!cpf) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        CPF não disponível para consulta REAP.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Carregando status REAP...</span>
      </div>
    );
  }

  const anosSimplificado = getAnosObrigatoriosSimplificado(emissaoRgp ?? null);
  const anosAnual = getAnosObrigatoriosAnual(emissaoRgp ?? null);
  const rgpNulo = !emissaoRgp;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 py-4">
        {rgpNulo && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
            <ClipboardList className="h-4 w-4 shrink-0" />
            Anos obrigatórios calculados com base em todos os anos (RGP não informado).
          </div>
        )}

        {/* REAP Simplificado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">REAP Simplificado</h3>
            <Badge variant="outline" className="text-[10px]">2021–2024</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {anosSimplificado.map((ano) => {
              const d = reap?.simplificado?.[String(ano)];
              return (
                <div key={ano} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-card">
                  <span className="text-xs font-semibold text-muted-foreground">{ano}</span>
                  <ReapStatusBadge
                    enviado={d?.enviado ?? false}
                    tem_problema={d?.tem_problema ?? false}
                    obs={d?.obs}
                    label={d?.enviado ? "Enviado" : "Pendente"}
                  />
                  {d?.obs && (
                    <p className="text-[10px] text-muted-foreground text-center leading-tight mt-1">
                      {d.obs}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* REAP Anual */}
        {anosAnual.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">REAP Anual</h3>
              <Badge variant="outline" className="text-[10px]">2025+</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {anosAnual.map((ano) => {
                const d = reap?.anual?.[String(ano)];
                return (
                  <div key={ano} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-card">
                    <span className="text-xs font-semibold text-muted-foreground">{ano}</span>
                    <ReapStatusBadge
                      enviado={d?.enviado ?? false}
                      tem_problema={d?.tem_problema ?? false}
                      obs={d?.obs}
                      label={d?.enviado ? "Enviado" : "Pendente"}
                    />
                    {d?.enviado && d?.data_envio && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(d.data_envio).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {d?.obs && (
                      <p className="text-[10px] text-muted-foreground text-center leading-tight mt-1">
                        {d.obs}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {anosSimplificado.length === 0 && anosAnual.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhum ano REAP obrigatório identificado para este sócio.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
