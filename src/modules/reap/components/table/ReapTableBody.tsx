import { TableBody, TableCell, TableRow } from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { AlertTriangle, Loader2, RefreshCcw, Settings2 } from "lucide-react";
import { ReapWithMember, ANOS_SIMPLIFICADO, ANO_INICIAL_ANUAL, ANO_ATUAL } from "../../types/reap.types";
import { ReapStatusBadge } from "../ReapStatusBadge";
import { ManageReapDialog } from "../ManageReapDialog";
import { useState } from "react";

interface ReapTableBodyProps {
  members: ReapWithMember[];
  isLoading: boolean;
  isFetching?: boolean;
  error: unknown;
  onRetry: () => void;
}

/**
 * Calcula os anos obrigatórios de Simplificado para um sócio,
 * com base na data de emissão do RGP.
 */
function getAnosObrigatoriosSimplificado(emissaoRgp: string | null): number[] {
  if (!emissaoRgp) return [...ANOS_SIMPLIFICADO];
  const anoRgp = new Date(emissaoRgp).getFullYear();
  return ANOS_SIMPLIFICADO.filter((ano) => ano >= anoRgp);
}

/**
 * Calcula os anos obrigatórios de REAP Anual para um sócio.
 */
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

export function ReapTableBody({
  members,
  isLoading,
  error,
  onRetry,
}: Readonly<ReapTableBodyProps>) {
  const [selectedMember, setSelectedMember] = useState<ReapWithMember | null>(null);
  const COLSPAN = 9;

  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={COLSPAN} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground transition-all animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Carregando REAPs...</p>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (error) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={COLSPAN} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center gap-4 text-destructive animate-in fade-in zoom-in duration-300">
              <p className="font-semibold text-lg">Erro ao carregar dados</p>
              <Button variant="outline" onClick={onRetry} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (members.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={COLSPAN} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground animate-in fade-in zoom-in duration-300">
              <p className="font-medium text-lg">Nenhum sócio encontrado</p>
              <p className="text-sm">Ajuste os filtros ou a busca.</p>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {members.map((member) => {
        const rgpNulo = !member.emissao_rgp;
        const anoRgpLabel = member.emissao_rgp
          ? new Date(member.emissao_rgp).getFullYear()
          : null;

        const temProblema = Object.values(member.simplificado).some((a) => a.tem_problema) ||
          Object.values(member.anual).some((a) => a.tem_problema);

        const anosAnualObrigatorios = getAnosObrigatoriosAnual(member.emissao_rgp);
        const anosSimplificadoObrigatorios = getAnosObrigatoriosSimplificado(member.emissao_rgp);

        return (
          <TableRow
            key={member.cpf}
            className="group hover:bg-muted/30 transition-colors"
          >
            {/* Sócio */}
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {member.member_nome ?? "—"}
                </span>
                {temProblema && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
              </div>
            </TableCell>

            {/* CPF */}
            <TableCell className="text-sm text-muted-foreground font-mono">
              {member.cpf}
            </TableCell>

            {/* RGP */}
            <TableCell className="text-center">
              {rgpNulo ? (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400"
                >
                  Não informado
                </Badge>
              ) : (
                <span className="px-2 py-0.5 rounded bg-muted text-xs font-bold">
                  {anoRgpLabel}
                </span>
              )}
            </TableCell>

            {/* Simplificado: 4 colunas (2021–2024) */}
            {ANOS_SIMPLIFICADO.map((ano) => {
              const obrigatorio = anosSimplificadoObrigatorios.includes(ano);
              const anoData = member.simplificado[String(ano)];
              if (!obrigatorio) {
                return (
                  <TableCell key={ano} className="text-center">
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  </TableCell>
                );
              }
              return (
                <TableCell key={ano} className="text-center">
                  <ReapStatusBadge
                    enviado={anoData?.enviado ?? false}
                    tem_problema={anoData?.tem_problema ?? false}
                    obs={anoData?.obs}
                    label={anoData?.enviado ? "OK" : "Pend."}
                  />
                </TableCell>
              );
            })}

            {/* REAP Anual (2025+) — resumo compacto */}
            <TableCell className="text-center">
              {anosAnualObrigatorios.length === 0 ? (
                <span className="text-muted-foreground/30 text-xs">—</span>
              ) : (
                <div className="flex flex-wrap gap-1 justify-center">
                  {anosAnualObrigatorios.map((ano) => {
                    const anoData = member.anual[String(ano)];
                    return (
                      <ReapStatusBadge
                        key={ano}
                        enviado={anoData?.enviado ?? false}
                        tem_problema={anoData?.tem_problema ?? false}
                        obs={anoData?.obs}
                        label={String(ano)}
                      />
                    );
                  })}
                </div>
              )}
            </TableCell>

            {/* Ações */}
            <TableCell className="text-right px-6">
              <Button
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                onClick={() => setSelectedMember(member)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Gerenciar
              </Button>
            </TableCell>
          </TableRow>
        );
      })}

      <ManageReapDialog 
        member={selectedMember} 
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
    </TableBody>
  );
}
