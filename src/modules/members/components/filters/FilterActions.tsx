import { Button } from "@/shared/components/ui/button";
interface FilterActionsProps {
  onClear: () => void;
  onApply: () => void;
}
export function FilterActions({ onClear, onApply }: FilterActionsProps) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onClear}>
        Limpar filtros
      </Button>
      <Button type="button" onClick={onApply}>
        Aplicar filtros
      </Button>
    </>
  );
}
