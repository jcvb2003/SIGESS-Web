import { TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function ReapTableHeader() {
  return (
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead className="font-semibold">Sócio</TableHead>
        <TableHead className="font-semibold">CPF</TableHead>
        <TableHead className="font-semibold text-center">RGP</TableHead>
        <TableHead className="font-semibold text-center" colSpan={4}>
          Simplificado (2021–2024)
        </TableHead>
        <TableHead className="font-semibold text-center">REAP 2025</TableHead>
        <TableHead />
      </TableRow>
      <TableRow className="bg-muted/30 border-t-0">
        <TableHead colSpan={3} />
        <TableHead className="text-center text-xs text-muted-foreground font-medium">2021</TableHead>
        <TableHead className="text-center text-xs text-muted-foreground font-medium">2022</TableHead>
        <TableHead className="text-center text-xs text-muted-foreground font-medium">2023</TableHead>
        <TableHead className="text-center text-xs text-muted-foreground font-medium">2024</TableHead>
        <TableHead />
        <TableHead />
      </TableRow>
    </TableHeader>
  );
}
