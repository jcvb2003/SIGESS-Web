import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { GovBatchStatusItem } from "@/shared/utils/browserDetection";
import type { SocioSelecionado } from "./govBatch.types";
import { GovStatusSection } from "./GovStatusSection";

interface SocioListItemProps {
  readonly socio: SocioSelecionado;
  readonly statusItem?: GovBatchStatusItem;
  readonly onRemove: (cpf: string) => void;
}

export function SocioListItem({
  socio,
  statusItem,
  onRemove,
}: Readonly<SocioListItemProps>) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{socio.nome}</p>
        <GovStatusSection statusItem={statusItem} />
        <div className="mt-1 flex flex-wrap gap-1">
          {socio.anosSimplificadoPendentes.map((ano) => (
            <span
              key={`s-${socio.cpf}-${ano}`}
              className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              Simpl. {ano}
            </span>
          ))}
          {socio.anosAnualPendentes.map((ano) => (
            <span
              key={`a-${socio.cpf}-${ano}`}
              className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary"
            >
              REAP {ano}
            </span>
          ))}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => onRemove(socio.cpf)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
