import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { RequestReportItem } from "../../services/reportsService";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
interface RequestsTableProps {
  data: RequestReportItem[];
  isLoading: boolean;
  onDelete: (id: string) => void;
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
}: RequestsTableProps) {
  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este requerimento?")) {
      onDelete(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando dados...
      </div>
    );
  }
  const { page, pageSize, total, totalPages, setPage, setPageSize } =
    pagination;
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, total);
  return (
    <CardContent className="p-0">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sócio/Requerente</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>RGP</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center pt-10 pb-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <SearchX className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-base font-medium text-foreground">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm mt-1 max-w-sm text-center">
                      Os resultados da sua busca não retornaram dados ou não há
                      requerimentos cadastrados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.data_req)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.cpf}</TableCell>
                  <TableCell>{item.rgp || item.emb_rgp || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline">Mostrar</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="hidden sm:inline">por página</span>
          </div>
          <span className="sm:ml-4">
            {total > 0
              ? `${startIndex}-${endIndex} de ${total}`
              : "0 registros"}
          </span>
        </div>

        <div className="flex items-center justify-center sm:justify-end space-x-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Anterior</span>
          </Button>
          <div className="text-sm font-medium whitespace-nowrap px-2">
            Página {page} de {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Próxima</span>
          </Button>
        </div>
      </div>
    </CardContent>
  );
}
