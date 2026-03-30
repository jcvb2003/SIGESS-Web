import { Button } from "@/shared/components/ui/button";

interface FinanceFilterActionsProps {
  onClear: () => void;
  onApply: () => void;
}

export function FinanceFilterActions({
  onClear,
  onApply,
}: Readonly<FinanceFilterActionsProps>) {
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
