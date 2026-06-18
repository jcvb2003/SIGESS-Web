import { Button } from "@/shared/components/ui/button";
import type { GovBatchStatusItem } from "@/shared/utils/browserDetection";
import type { GovBatchDaeAction } from "./govBatch.types";
import { formatBoletoCurrency } from "../utils/govBatchFormatters";

interface BoletoInfoDisplayProps {
  readonly statusItem: GovBatchStatusItem;
  readonly daeAction?: GovBatchDaeAction | null;
  readonly daeActionDisabled?: boolean;
  readonly onDaeAction?: () => void;
}

export function BoletoInfoDisplay({
  statusItem,
  daeAction,
  daeActionDisabled = false,
  onDaeAction,
}: Readonly<BoletoInfoDisplayProps>) {
  if (!statusItem.boletoInfo) return null;

  const {
    detectado,
    competencia,
    valorComercializado,
    valorDeclarado,
    valorPago,
  } = statusItem.boletoInfo;

  const valorComercializadoLabel = formatBoletoCurrency(valorComercializado);
  const valorDeclaradoLabel = formatBoletoCurrency(valorDeclarado);
  const valorPagoLabel = formatBoletoCurrency(valorPago);
  const valueParts = [
    valorComercializadoLabel && `Comercializado: ${valorComercializadoLabel}`,
    valorDeclaradoLabel && `Declarado: ${valorDeclaradoLabel}`,
    valorPagoLabel && `Pago: ${valorPagoLabel}`,
  ].filter(Boolean);

  if (statusItem.status === "verificando_boleto") {
    if (detectado) {
      return (
        <div className="mt-2 rounded-sm bg-blue-50 p-2 text-xs text-blue-900">
          <p className="font-medium">Boleto detectado: {competencia}</p>
          {valueParts.length > 0 && <p>{valueParts.join(" | ")}</p>}
        </div>
      );
    }

    return (
      <div className="mt-2 rounded-sm bg-amber-50 p-2 text-xs text-amber-900">
        <p className="font-medium">Boleto nao detectado. Gerando...</p>
      </div>
    );
  }

  if (statusItem.status === "boleto_salvo") {
    const tipo = statusItem.boletoGerado ? "Gerado" : "Ja existia";
    const actionLabel =
      daeAction === "registrar"
        ? "Registrar"
        : daeAction === "marcar_pago"
          ? "Marcar como pago"
          : daeAction === "registrado"
            ? "Registrado"
            : null;

    return (
      <div className="mt-2 rounded-sm bg-primary/5 p-2 text-xs text-primary">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium">Boleto salvo com sucesso - {tipo}</p>
            {competencia && (
              <p>
                {competencia}
                {valueParts.length > 0 && ` | ${valueParts.join(" | ")}`}
              </p>
            )}
          </div>
          {actionLabel && (
            <Button
              type="button"
              size="sm"
              variant={daeAction === "registrado" ? "outline" : "default"}
              className="h-7 px-2.5 text-[11px]"
              disabled={daeActionDisabled || daeAction === "registrado"}
              onClick={onDaeAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
