import { useState, useMemo } from "react";
import { format } from "date-fns";
import { 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { CancelPaymentDialog } from "../../dialogs/CancelPaymentDialog";
import { EditDAEDialog } from "../../dialogs/EditDAEDialog";
import { useCancelFinanceActions } from "../../../hooks/edit/useCancelFinanceActions";
import { useUpdateFinanceActions } from "../../../hooks/edit/useUpdateFinanceActions";
import { SessionReceiptDialog } from "../../dialogs/SessionReceiptDialog";
import { financeService } from "../../../services/financeService";
import { daeService } from "../../../services/daeService";
import { usePermissions } from "@/shared/hooks/usePermissions";
import type { FinanceDAE, FinanceLancamento, EditDAEData } from "../../../types/finance.types";
import { DAERow } from "./components/DAERow";

const MONTH_LABELS = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/**
 * Agrupa os DAEs por grupo_id e processa standalone
 */
function getGroupedDAEs(daes: FinanceDAE[]) {
  const active = daes.filter((d) => d.status !== "cancelado");
  
  const groups: Record<string, FinanceDAE[]> = {};
  const standalone: FinanceDAE[] = [];

  active.forEach(d => {
    if (d.grupo_id) {
      if (!groups[d.grupo_id]) groups[d.grupo_id] = [];
      groups[d.grupo_id].push(d);
    } else {
      standalone.push(d);
    }
  });

  const result = [
    ...standalone.map(d => ({
      id: d.id,
      isGroup: false,
      lead: d,
      items: [d],
      totalValue: d.valor || 0,
      competencia_ano: d.competencia_ano || 0,
      competencia_mes: d.competencia_mes || 0,
      label: `${MONTH_LABELS[d.competencia_mes || 0]}/${d.competencia_ano}`
    })),
    ...Object.entries(groups).map(([gid, members]) => {
      const sorted = [...members].sort((a,b) => (a.competencia_mes || 0) - (b.competencia_mes || 0));
      const lead = sorted[0];
      const last = sorted.at(-1);
      const totalValue = members.reduce((sum, m) => sum + (m.valor || 0), 0);

      let monthRangeLabel = "";
      if (lead && last && sorted.length > 1) {
        monthRangeLabel = `${MONTH_LABELS[lead.competencia_mes || 0]} — ${MONTH_LABELS[last.competencia_mes || 0]} / ${lead.competencia_ano}`;
      } else if (lead) {
        monthRangeLabel = `${MONTH_LABELS[lead.competencia_mes || 0]}/${lead.competencia_ano}`;
      }

      return {
        id: gid,
        isGroup: true,
        lead,
        items: sorted,
        totalValue,
        competencia_ano: lead?.competencia_ano ?? 0,
        competencia_mes: lead?.competencia_mes ?? 0,
        label: monthRangeLabel
      };
    })
  ];

  return result.sort((a, b) => {
    const ya = (a.competencia_ano || 0) * 100 + (a.competencia_mes || 0);
    const yb = (b.competencia_ano || 0) * 100 + (b.competencia_mes || 0);
    return yb - ya;
  });
}

interface DAESectionProps {
  readonly daes: FinanceDAE[];
}

export function DAESection({ daes }: DAESectionProps) {
  const [selectedItem, setSelectedItem] = useState<FinanceDAE | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusDate, setStatusDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { cancelDAE } = useCancelFinanceActions();
  const { 
    toggleBoletoStatus, 
    updateDAE, 
    updateGroupDAE 
  } = useUpdateFinanceActions();
  const { isAdmin } = usePermissions();

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ lancamentos: FinanceLancamento[], daes: FinanceDAE[] }>({ lancamentos: [], daes: [] });
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const handleViewReceipt = async (sessaoId: string) => {
    setIsLoadingReceipt(true);
    try {
      const [l, d] = await Promise.all([
        financeService.getSessionPayments(sessaoId),
        daeService.getSessionDAEs(sessaoId)
      ]);
      setReceiptData({ lancamentos: l, daes: d });
      setIsReceiptOpen(true);
    } catch (error) {
      console.error("Erro ao carregar recibo:", error);
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  // Filtra e agrupa os DAEs ativos
  const groupedData = useMemo(() => getGroupedDAEs(daes), [daes]);

  const handleDelete = (item: FinanceDAE) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (item: FinanceDAE) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleToggleStatusClick = (item: FinanceDAE) => {
    setSelectedItem(item);
    if (item.boleto_pago) {
      // Simples confirmação para desmarcar
      setIsStatusDialogOpen(true);
    } else {
      // Abrir para escolher data
      setStatusDate(format(new Date(), "yyyy-MM-dd"));
      setIsStatusDialogOpen(true);
    }
  };

  const confirmToggleStatus = () => {
    if (!selectedItem) return;

    toggleBoletoStatus.mutate({
      id: selectedItem.id,
      pago: !selectedItem.boleto_pago,
      dataPagamento: selectedItem.boleto_pago ? undefined : statusDate
    }, {
      onSuccess: () => setIsStatusDialogOpen(false)
    });
  };

  const handleEditConfirm = (data: EditDAEData) => {
    if (data.isGroup && data.grupoId && data.items) {
      updateGroupDAE.mutate({
        grupoId: data.grupoId,
        year: data.year,
        items: data.items
      }, {
        onSuccess: () => setIsEditDialogOpen(false)
      });
    } else if (selectedItem && data.valor && data.competencia_mes && data.competencia_ano) {
      updateDAE.mutate({
        id: selectedItem.id,
        data: {
          valor: data.valor,
          competencia_mes: data.competencia_mes,
          competencia_ano: data.competencia_ano
        }
      }, {
        onSuccess: () => setIsEditDialogOpen(false)
      });
    }
  };

  const cancelDescription = useMemo(() => {
    if (!selectedItem) return "";
    if (selectedItem.grupo_id) {
      return `ATENÇÃO: Este boleto é AGRUPADO. Ao cancelar, TODOS os meses vinculados a este talão serão anulados juntos para preservar a integridade do documento original.`;
    }
    return `Excluir Repasse DAE: ${MONTH_LABELS[selectedItem.competencia_mes || 0]}/${selectedItem.competencia_ano}`;
  }, [selectedItem]);

  const statusDialogHeaderClass = selectedItem?.boleto_pago ? "bg-amber-50" : "bg-emerald-50";
  
  const statusDialogDescription = useMemo(() => {
    if (selectedItem?.boleto_pago) return "Deseja reverter o status deste boleto para pendente?";
    const monthLabel = selectedItem ? MONTH_LABELS[selectedItem.competencia_mes || 0] : "";
    return `Registrar o repasse de ${monthLabel}/${selectedItem?.competencia_ano} como pago.`;
  }, [selectedItem]);

  const toggleStatusButtonText = useMemo(() => {
    if (toggleBoletoStatus.isPending) return null;
    return selectedItem?.boleto_pago ? "Confirmar" : "Salvar Pagamento";
  }, [toggleBoletoStatus.isPending, selectedItem]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Boletos eSocial (DAE)
        </h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {groupedData.length} {groupedData.length === 1 ? "documento" : "documentos"}
        </span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {groupedData.map((g) => (
          <DAERow
            key={g.id}
            group={g}
            isAdmin={isAdmin}
            isLoadingReceipt={isLoadingReceipt}
            isStatusPending={toggleBoletoStatus.isPending}
            onToggleStatus={handleToggleStatusClick}
            onViewReceipt={handleViewReceipt}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Diálogos de Ação */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-[320px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className={cn("p-6 text-center space-y-2", statusDialogHeaderClass)}>
            <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              {selectedItem?.boleto_pago ? (
                <AlertCircle className="h-8 w-8 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              )}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {selectedItem?.boleto_pago ? "Desmarcar Pagamento" : "Confirmar Pagamento"}
            </DialogTitle>
            <p className="text-xs text-slate-500 leading-relaxed px-2">
              {statusDialogDescription}
            </p>
          </DialogHeader>

          <div className="px-6 py-6 space-y-4">
            {!selectedItem?.boleto_pago && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  Data do Pagamento
                </Label>
                <Input 
                  type="date" 
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="h-10 text-sm focus:ring-emerald-500 border-slate-200"
                />
              </div>
            )}
            
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsStatusDialogOpen(false)}
                className="flex-1 h-10 text-xs font-semibold"
                disabled={toggleBoletoStatus.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmToggleStatus}
                disabled={toggleBoletoStatus.isPending}
                className={cn(
                  "flex-1 h-10 text-xs font-bold",
                  selectedItem?.boleto_pago 
                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {toggleBoletoStatus.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : toggleStatusButtonText}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <CancelPaymentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemId={selectedItem?.id ?? null}
        itemDescription={cancelDescription}
        onConfirm={async (observation) => {
          if (selectedItem) {
            await cancelDAE.mutateAsync({ 
              id: selectedItem.id, 
              observation 
            });
            setIsDeleteDialogOpen(false);
          }
        }}
        isPending={cancelDAE.isPending}
        title="Cancelar Repasse DAE"
      />

      <SessionReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        lancamentos={receiptData.lancamentos}
        daes={receiptData.daes}
        memberCpf={daes[0]?.socio_cpf ?? undefined}
      />

      <EditDAEDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        dae={selectedItem}
        onConfirm={handleEditConfirm}
        isPending={updateDAE.isPending || updateGroupDAE.isPending}
      />
    </div>
  );
}
