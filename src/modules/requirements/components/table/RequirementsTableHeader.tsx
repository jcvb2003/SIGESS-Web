import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export function RequirementsTableHeader() {
  return (
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead className="w-[100px] font-bold">Protocolo</TableHead>
        <TableHead className="font-bold">Pescador(a)</TableHead>
        <TableHead className="w-[120px] font-bold">CPF</TableHead>
        <TableHead className="w-[120px] font-bold text-center">Exercício</TableHead>
        <TableHead className="w-[150px] font-bold">Status MTE</TableHead>
        <TableHead className="w-[120px] font-bold">Benefício</TableHead>
        <TableHead className="w-[150px] font-bold">Req. MTE</TableHead>
        <TableHead className="w-[120px] font-bold text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
}
