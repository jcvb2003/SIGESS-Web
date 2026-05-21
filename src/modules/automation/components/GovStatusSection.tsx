import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/shared/lib/utils";
import { getTodayISO } from "@/shared/utils/date";
import type { GovBatchStatusItem } from "@/shared/utils/browserDetection";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DAEDialog } from "@/modules/finance/components/dialogs/DAEDialog";
import { financeQueryKeys } from "@/modules/finance/queryKeys";
import { useDAE } from "@/modules/finance/hooks/edit/useDAE";
import { daeService } from "@/modules/finance/services/daeService";
import { GovBatchTrack } from "./GovBatchTrack";
import { BoletoInfoDisplay } from "./BoletoInfoDisplay";
import { parseGovCompetencia } from "../utils/govBatchFormatters";
import type { GovBatchDaeAction } from "./govBatch.types";
import {
  resolveStatusHeading,
  statusTextClassName,
} from "../utils/govBatchStatus";

interface GovStatusSectionProps {
  readonly statusItem?: GovBatchStatusItem;
  readonly socioCpf: string;
  readonly socioNome: string;
}

function resolveInitialDaeValue(statusItem?: GovBatchStatusItem): number | undefined {
  const valorPago = statusItem?.boletoInfo?.valorPago;
  if (typeof valorPago === "number" && valorPago > 0) {
    return valorPago;
  }

  const valorDeclarado = statusItem?.boletoInfo?.valorDeclarado;
  if (typeof valorDeclarado === "number" && valorDeclarado > 0) {
    return valorDeclarado;
  }

  return undefined;
}

export function GovStatusSection({
  statusItem,
  socioCpf,
  socioNome,
}: Readonly<GovStatusSectionProps>) {
  const queryClient = useQueryClient();
  const { updateBoleto } = useDAE();
  const [daeDialogOpen, setDaeDialogOpen] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [markPaidDate, setMarkPaidDate] = useState(getTodayISO());

  const competenciaData = useMemo(
    () => parseGovCompetencia(statusItem?.boletoInfo?.competencia),
    [statusItem?.boletoInfo?.competencia],
  );

  const daeStatusQuery = useQuery({
    queryKey: competenciaData
      ? financeQueryKeys.daeStatus(socioCpf, competenciaData.year, competenciaData.month)
      : ["finance", "daeStatus", socioCpf, "sem-competencia"],
    enabled:
      statusItem?.status === "boleto_salvo" &&
      Boolean(socioCpf) &&
      Boolean(competenciaData),
    queryFn: async () => {
      if (!competenciaData) return null;
      return daeService.getDAEStatusByCompetencia(
        socioCpf,
        competenciaData.year,
        competenciaData.month,
      );
    },
  });

  const daeAction: GovBatchDaeAction | null = useMemo(() => {
    if (statusItem?.status !== "boleto_salvo" || !competenciaData || daeStatusQuery.isError) {
      return null;
    }

    const currentDae = daeStatusQuery.data;
    if (!currentDae) {
      return "registrar";
    }

    return currentDae.boletoPago ? "registrado" : "marcar_pago";
  }, [
    competenciaData,
    daeStatusQuery.data,
    daeStatusQuery.isError,
    statusItem?.status,
  ]);

  const initialBoletoPago = Boolean(
    statusItem?.boletoInfo?.valorPago && statusItem.boletoInfo.valorPago > 0,
  );
  const initialValue = resolveInitialDaeValue(statusItem);

  const handleDaeAction = () => {
    if (daeAction === "registrar") {
      setDaeDialogOpen(true);
      return;
    }

    if (daeAction === "marcar_pago") {
      setMarkPaidDate(getTodayISO());
      setMarkPaidDialogOpen(true);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!competenciaData || !daeStatusQuery.data?.id) return;

    await updateBoleto.mutateAsync({
      id: daeStatusQuery.data.id,
      pago: true,
      dataPagamento: markPaidDate,
    });

    await queryClient.invalidateQueries({
      queryKey: financeQueryKeys.daeStatus(
        socioCpf,
        competenciaData.year,
        competenciaData.month,
      ),
    });

    setMarkPaidDialogOpen(false);
  };

  if (!statusItem) {
    return (
      <div className="mt-1 space-y-1.5">
        <GovBatchTrack />
        <p className="text-xs text-muted-foreground">
          Aguardando envio para a extensao
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-1 space-y-1.5">
        <GovBatchTrack statusItem={statusItem} />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.14em]",
              statusTextClassName(statusItem.status),
            )}
          >
            {resolveStatusHeading(statusItem)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {statusItem.statusDescription ||
            "A extensao atualizou o progresso desta sessao."}
        </p>
        <BoletoInfoDisplay
          statusItem={statusItem}
          daeAction={daeAction}
          daeActionDisabled={daeStatusQuery.isPending || updateBoleto.isPending}
          onDaeAction={handleDaeAction}
        />
        {statusItem.status === "erro" && statusItem.lastError && (
          <p className="text-xs text-destructive">{statusItem.lastError}</p>
        )}
      </div>

      <DAEDialog
        open={daeDialogOpen}
        onOpenChange={setDaeDialogOpen}
        socioCpf={socioCpf}
        socioName={socioNome}
        initialValue={initialValue}
        initialMonth={competenciaData?.month}
        initialYear={competenciaData?.year}
        initialBoletoPago={initialBoletoPago}
      />

      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar repasse como pago</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Confirme a data do pagamento do boleto para atualizar este DAE.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="gov-batch-dae-payment-date">Data do pagamento</Label>
              <Input
                id="gov-batch-dae-payment-date"
                type="date"
                value={markPaidDate}
                onChange={(event) => setMarkPaidDate(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMarkPaidDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmMarkPaid}
                disabled={updateBoleto.isPending}
              >
                Marcar como pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
