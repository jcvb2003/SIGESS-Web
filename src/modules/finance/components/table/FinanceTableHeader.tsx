import { TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function FinanceTableHeader() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto">
          Sócio
        </TableHead>
        <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
          CPF
        </TableHead>
        <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
          Regime
        </TableHead>
        <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
          Situação
        </TableHead>
        <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
          Último pag.
        </TableHead>
        <TableHead className="text-sm font-semibold text-muted-foreground py-4 px-4 h-auto whitespace-nowrap">
          Anuidades
        </TableHead>
        <TableHead className="text-right text-sm font-semibold text-muted-foreground py-4 px-4 h-auto w-[1%] whitespace-nowrap">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
