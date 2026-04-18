import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  History,
  Search,
  User as UserIcon,
  Clock,
  FileJson,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useFinanceAudit } from "../../hooks/data/useFinanceAudit";
import { buildAuditSummary } from "../../utils/auditSummary";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";

interface AuditLogDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AuditLogDialog({ open, onOpenChange }: AuditLogDialogProps) {
  const [limit] = useState(50);
  const [offset] = useState(0);

  const { data: logs, isLoading, error } = useFinanceAudit({ limit, offset });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 outline-none overflow-hidden h-[85vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Auditoria Financeira
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Histórico completo de alterações e exclusões
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {(() => {
            if (isLoading) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-medium text-muted-foreground">Carregando logs...</p>
                </div>
              );
            }

            if (error) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Falha ao carregar auditoria</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Não foi possível recuperar os dados de auditoria do servidor.
                    </p>
                  </div>
                </div>
              );
            }

            if (!logs || logs.length === 0) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center">
                  <Search className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhum registro encontrado.</p>
                </div>
              );
            }

            return (
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-[160px] text-xs font-bold uppercase tracking-wider">Data</TableHead>
                        <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider">Operação</TableHead>
                        <TableHead className="w-[180px] text-xs font-bold uppercase tracking-wider">Usuário</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider">Resumo das Alterações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-foreground">
                                {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(log.created_at), "HH:mm:ss")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-tight",
                                log.operation === "PURGE" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                                log.operation === "DELETE" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                                log.operation === "CANCEL_PAYMENT" && "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
                                log.operation === "UPDATE" && "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
                                log.operation === "INSERT" && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                              )}
                            >
                              {log.operation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate">
                                  {log.user_nome || "Sistema"}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {log.user_email || "N/A"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                                {buildAuditSummary(log.operation, log.old_data, log.new_data)}
                              </p>

                              {log.operation === "UPDATE" && (
                                <button className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline w-fit">
                                  <FileJson className="h-3 w-3" />
                                  Ver dados brutos (JSON)
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            );
          })()}
        </div>

        <div className="px-6 py-4 border-t bg-muted/5 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-medium text-muted-foreground italic">
            * Logs de auditoria são mantidos permanentemente para conformidade técnica.
          </p>
          <div className="flex gap-2">
            {/* Pagination can be added here later */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
