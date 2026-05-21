import type { GovBatchStatusItem } from "@/shared/utils/browserDetection";
import { formatBoletoCurrency } from "../utils/govBatchFormatters";

interface BoletoInfoDisplayProps {
  readonly statusItem: GovBatchStatusItem;
}

export function BoletoInfoDisplay({
  statusItem,
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
        <p className="font-medium">Boleto não detectado. Gerando...</p>
      </div>
    );
  }

  if (statusItem.status === "boleto_salvo") {
    const tipo = statusItem.boletoGerado ? "Gerado" : "Já existia";
    return (
      <div className="mt-2 rounded-sm bg-emerald-50 p-2 text-xs text-emerald-900">
        <p className="font-medium">Boleto salvo com sucesso - {tipo}</p>
        {competencia && (
          <p>
            {competencia}
            {valueParts.length > 0 && ` | ${valueParts.join(" | ")}`}
          </p>
        )}
      </div>
    );
  }

  return null;
}
