import { RequestReportItem } from "../../services/reportsService";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { MemberCpfCell } from "@/modules/members/components/table/cells/MemberCpfCell";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CardContent } from "@/shared/components/ui/card";
import { DataTable, ColumnDef } from "@/shared/components/layout/DataTable";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";

interface RequestsTableProps {
  data: RequestReportItem[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
  };
}

export function RequestsTable({
  data,
  isLoading,
  onDelete,
  pagination,
}: Readonly<RequestsTableProps>) {
  const handleDelete = (id: string) => {
    if (globalThis.confirm("Tem certeza que deseja excluir este requerimento?")) {
      onDelete?.(id);
    }
  };

  const columns: ColumnDef<RequestReportItem>[] = [
    {
      header: "Sócio/Requerente",
      cell: (item) => (
        <span className="font-medium text-foreground uppercase">
          {item.nome}
        </span>
      )
    },
    {
      header: "CPF",
      cell: (item) => <MemberCpfCell cpf={item.cpf} />
    },
    {
      header: "Data de assinatura",
      className: "w-[150px]",
      cell: (item) => item.data_req ? formatDate(item.data_req) : "---"
    },
    {
      header: "RGP",
      className: "font-medium",
      cell: (item) => item.rgp || item.num_rgp || "---"
    },
    {
      header: "Data do RGP",
      className: "whitespace-nowrap",
      cell: (item) => item.emissao_rgp ? formatDate(item.emissao_rgp) : "---"
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      className: "text-right w-[80px]",
      cell: (item) => (
        onDelete && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-red-600 hover:text-white hover:border-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5}>Excluir</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      )
    }
  ];

  return (
    <CardContent className="p-0">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        variant="minimal"
        emptyMessage="Nenhum registro encontrado"
        emptyDescription="Os resultados da sua busca não retornaram dados ou não há requerimentos cadastrados."
      />

      <DataTablePagination
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        onPageSizeChange={(v) => pagination.setPageSize(Number(v))}
        onPageChange={pagination.setPage}
        entityName="registros"
      />
    </CardContent>
  );
}
