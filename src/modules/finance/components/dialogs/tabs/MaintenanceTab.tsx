import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Trash2, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { usePurgeFinanceActions } from "../../../hooks/edit/usePurgeFinanceActions";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

export function MaintenanceTab() {
  const [days, setDays] = useState("365");
  const { purgeBulk, isPurgingBulk } = usePurgeFinanceActions();

  const handleBulkPurge = async () => {
    await purgeBulk(Number(days));
  };

  return (
    <ScrollArea className="h-full px-4 sm:px-6">
      <div className="space-y-6 py-6">
        <div className="space-y-2">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Trash2 className="h-4 w-4 text-destructive" />
            Limpeza de Dados (Purge)
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O sistema de finanças do SIGESS não remove registros fisicamente durante o uso normal. 
            Esta ferramenta permite a exclusão definitiva de registros que já foram cancelados há bastante tempo 
            para manter o banco de dados otimizado.
          </p>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-destructive uppercase tracking-tight">Zona de Risco</p>
              <p className="text-[11px] text-destructive/80 font-medium leading-normal">
                A exclusão física é <strong>IRREVERSÍVEL</strong>. Embora uma cópia dos dados seja mantida no log de auditoria, 
                o registro deixará de existir nas tabelas operacionais e relatórios.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Período de Retenção
              </Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Mais de 30 dias (1 mês)</SelectItem>
                  <SelectItem value="90">Mais de 90 dias (3 meses)</SelectItem>
                  <SelectItem value="180">Mais de 180 dias (6 meses)</SelectItem>
                  <SelectItem value="365">Mais de 365 dias (1 ano)</SelectItem>
                  <SelectItem value="730">Mais de 2 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full h-10 gap-2 font-bold text-xs uppercase tracking-widest"
                  disabled={isPurgingBulk}
                >
                  {isPurgingBulk ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Executar Limpeza em Massa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <ShieldCheck className="h-5 w-5" />
                    Confirmar Exclusão Permanente
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs font-medium leading-relaxed">
                    Você está prestes a apagar permanentemente todos os lançamentos financeiros com status
                    {" "}<strong>"cancelado"</strong>{" "} que foram criados há mais de{" "}
                    <strong>{days} dias</strong>. Esta ação é <strong>IRREVERSÍVEL</strong>.
                    Deseja continuar com esta operação administrativa?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs font-bold uppercase tracking-tight">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkPurge}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold uppercase tracking-tight"
                  >
                    Sim, Excluir Definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
             <HistoryIcon className="h-4 w-4 text-primary" />
             <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Notas de Segurança</h4>
          </div>
          <ul className="space-y-2">
            <li className="text-[10px] text-muted-foreground flex items-start gap-2">
              <span className="h-1 w-1 rounded-full bg-primary mt-1 shrink-0" />
              {" "}Apenas registros com status "cancelado" são afetados.
            </li>
            <li className="text-[10px] text-muted-foreground flex items-start gap-2">
              <span className="h-1 w-1 rounded-full bg-primary mt-1 shrink-0" />
              {" "}O vínculo com cobranças será removido (a cobrança permanece cancelada/pendente).
            </li>
          </ul>
        </div>
      </div>
    </ScrollArea>
  );
}

function HistoryIcon(props: Readonly<React.SVGProps<SVGSVGElement>>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="m12 7v5l4 2" />
    </svg>
  );
}
