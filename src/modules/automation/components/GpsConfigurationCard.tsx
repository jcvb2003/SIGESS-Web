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
    <div className="w-full max-w-[360px] rounded-lg border bg-muted/20 px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Configuração GPS
      </div>

      {enabled ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-end">
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Competência
            </div>
            <div className="h-8 rounded-md border bg-muted/50 px-2.5 py-1.5 text-sm font-medium text-muted-foreground">
              {competencia}
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="automation-gps-valor"
              className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            >
              Valor
            </label>
            <Input
              id="automation-gps-valor"
              value={valor}
              onChange={(event) => onValorChange(event.target.value)}
              placeholder="Ex: 380,00"
              inputMode="numeric"
              maxLength={15}
              className="h-8 bg-background px-2.5"
            />
          </div>
        </div>
      ) : (
        <div className="mt-2 text-sm text-muted-foreground">{message}</div>
      )}
    </div>
  );
}
