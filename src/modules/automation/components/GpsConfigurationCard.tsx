interface GpsConfigurationCardProps {
  readonly enabled: boolean;
  readonly competencia: string;
  readonly valor: string;
  readonly message: string;
}

export function GpsConfigurationCard({
  enabled,
  competencia,
  valor,
  message,
}: Readonly<GpsConfigurationCardProps>) {
  return (
    <div className="flex min-w-[240px] max-w-[320px] flex-col gap-1 rounded-md border bg-muted/20 px-3 py-2 lg:items-end">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Configuração GPS
      </div>
      {enabled ? (
        <>
          <div className="text-right text-xs text-foreground">
            Competência: {competencia}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Valor definido: {valor}
          </div>
        </>
      ) : (
        <div className="text-right text-xs text-muted-foreground">
          {message}
        </div>
      )}
    </div>
  );
}
