import { TableBody, TableCell, TableRow } from "@/shared/components/ui/table";
import { RequirementWithMember } from "../../types/requirement.types";
import { StatusBadge } from "../StatusBadge";
import { Button } from "@/shared/components/ui/button";
import { Eye, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface RequirementsTableBodyProps {
  requirements: RequirementWithMember[];
  isLoading: boolean;
  isFetching?: boolean;
  error: unknown;
  onRetry: () => void;
  onViewDetail: (id: string) => void;
}

export function RequirementsTableBody({
  requirements,
  isLoading,
  error,
  onRetry,
  onViewDetail,
}: Readonly<RequirementsTableBodyProps>) {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={7} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground transition-all animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Carregando requerimentos...</p>
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
          <TableCell colSpan={7} className="h-64 text-center">
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

  if (requirements.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={7} className="h-64 text-center">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground animate-in fade-in zoom-in duration-300">
              <p className="font-medium text-lg">Nenhum requerimento encontrado</p>
              <p className="text-sm">Ajuste os filtros ou cadastre um novo protocolo.</p>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {requirements.map((req) => {
        const isEmDia = req.situacao_financeira === 'em_dia';
        const isIsento = req.situacao_financeira === 'isento';

        let statusColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse";
        let statusTitle = "Financeiro: Em Atraso";

        if (isEmDia) {
          statusColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
          statusTitle = "Financeiro: Em Dia";
        } else if (isIsento) {
          statusColor = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
          statusTitle = "Financeiro: Isento";
        }

        return (
          <TableRow key={req.id} className="group hover:bg-muted/30 transition-colors cursor-pointer">
            <TableCell className="font-mono text-sm font-semibold text-primary">
              {req.cod_req}
            </TableCell>
            <TableCell>
              <div className="flex flex-col relative group/name">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {req.member_nome}
                  </span>
                  <div
                    className={cn("w-2 h-2 rounded-full", statusColor)}
                    title={statusTitle}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  NIT: {req.member_nit || "---"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {req.cpf}
            </TableCell>
            <TableCell className="text-center">
              <span className="px-2 py-1 rounded bg-muted text-xs font-bold">
                {req.ano_referencia}
              </span>
            </TableCell>
            <TableCell>
              <StatusBadge status={req.status_mte} />
            </TableCell>
            <TableCell>
              {req.beneficio_recebido ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-sm animate-in fade-in zoom-in duration-300">
                  RECEBIDO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                  AGUARDANDO
                </span>
              )}
            </TableCell>
            <TableCell className="text-sm font-medium">
              {req.num_req_mte || "---"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end items-center gap-2">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                        onClick={() => onViewDetail(req.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={5}>Visualizar Requerimento</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
}
