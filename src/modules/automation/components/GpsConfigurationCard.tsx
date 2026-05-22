import { Input } from "@/shared/components/ui/input";

interface GpsConfigurationCardProps {
  readonly enabled: boolean;
  readonly competencia: string;
  readonly valor: string;
  readonly message: string;
  readonly onValorChange: (value: string) => void;
}

export function GpsConfigurationCard({
  enabled,
  competencia,
  valor,
  message,
  onValorChange,
}: Readonly<GpsConfigurationCardProps>) {
  return (
    <div className="flex min-w-[240px] max-w-[320px] flex-col gap-2 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Configuração GPS
      </div>
      {enabled ? (
        <>
          <div className="text-xs text-foreground">Competência: {competencia}</div>
          <div className="space-y-1">
            <label
              htmlFor="automation-gps-valor"
              className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            >
              Valor comercializado
            </label>
            <Input
              id="automation-gps-valor"
              value={valor}
              onChange={(event) => onValorChange(event.target.value)}
              placeholder="Ex: 380,00"
              inputMode="numeric"
              maxLength={15}
              className="h-8 bg-background"
            />
          </div>
        </>
      ) : (
        <div className="text-xs text-muted-foreground">{message}</div>
      )}
    </div>
  );
}
