import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { usePortariaScope } from "@/shared/context/PortariaContext";
import { usePortariasData } from "@/modules/members/hooks/data/usePortariasData";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function GlobalPortariaSelect() {
  const { unitId } = useActiveScope();
  const { portarias } = usePortariasData(unitId);
  const { activePortariaId, setActivePortariaId } = usePortariaScope();

  if (portarias.length < 2) return null;

  const value = activePortariaId ?? "all";

  return (
    <Select
      value={value}
      onValueChange={(v) => setActivePortariaId(v === "all" ? null : v)}
    >
      <SelectTrigger className="h-8 w-48 text-sm bg-muted/50 border-border/50 focus:bg-background">
        <SelectValue placeholder="Todas as portarias" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as portarias</SelectItem>
        {portarias.map((p) => (
          <SelectItem key={p.id} value={p.id!}>
            {p.codigoPortaria} - {p.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
