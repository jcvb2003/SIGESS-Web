import { TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface MembersTableHeaderProps {
  sortConfig: { field: string; direction: "asc" | "desc" };
  onSort: (field: string) => void;
}

export function MembersTableHeader({
  sortConfig,
  onSort,
}: Readonly<MembersTableHeaderProps>) {
  const getSortIcon = (field: string) => {
    if (sortConfig.field !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <TableHeader className="bg-muted/30">
      <TableRow>
        <TableHead
          className="px-1 py-1 md:px-6 md:py-4 w-full cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onSort("nome")}
        >
          <div className="flex items-center">Sócio {getSortIcon("nome")}</div>
        </TableHead>
        <TableHead
          className="px-1 py-1 md:px-6 md:py-4 whitespace-nowrap cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onSort("cpf")}
        >
          <div className="flex items-center">CPF {getSortIcon("cpf")}</div>
        </TableHead>
        <TableHead className="px-1 py-1 md:px-6 md:py-4 whitespace-nowrap">
          Localidade
        </TableHead>
        <TableHead
          className="px-1 py-1 md:px-6 md:py-4 whitespace-nowrap cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onSort("data_de_admissao")}
        >
          <div className="flex items-center">
            Data de filiação {getSortIcon("data_de_admissao")}
          </div>
        </TableHead>
        <TableHead className="px-1 py-1 md:px-6 md:py-4 whitespace-nowrap">
          Situação
        </TableHead>
        <TableHead className="text-right px-1 py-1 md:px-6 md:py-4 whitespace-nowrap w-[1%]">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
