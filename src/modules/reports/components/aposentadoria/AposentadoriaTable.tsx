import { DataTable } from "@/shared/components/layout/DataTable";
import { DataTablePagination } from "@/shared/components/layout/DataTablePagination";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { formatDate } from "@/shared/utils/formatters/dateFormatters";
import { getAgeYears } from "@/modules/reports/domain/aposentadoriaRules";
import type { AposentadoriaItem } from "../../services/reportsService";

const CATEGORY_CONFIG = {
  aposentado: { label: 'Aposentado', variant: 'info' as const },
  apto:       { label: 'Apto',       variant: 'success' as const },
  em_breve:   { label: 'Em breve',   variant: 'warning' as const },
};

const SEXO_LABEL: Record<string, string> = {
  MASCULINO: 'M',
  FEMININO: 'F',
};

interface AposentadoriaTableProps {
  data: AposentadoriaItem[];
  isLoading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    setPage: (p: number) => void;
    setPageSize: (s: number) => void;
  };
}

export function AposentadoriaTable({ data, isLoading, pagination }: Readonly<AposentadoriaTableProps>) {
  const columns = [
    {
      header: 'Nome',
      cell: (item: AposentadoriaItem) => (
        <span className="text-sm font-medium text-foreground">{item.nome}</span>
      ),
    },
    {
      header: 'CPF',
      className: 'whitespace-nowrap',
      cell: (item: AposentadoriaItem) => (
        <span className="text-sm text-muted-foreground">{item.cpf}</span>
      ),
    },
    {
      header: 'Nascimento',
      className: 'whitespace-nowrap',
      cell: (item: AposentadoriaItem) => (
        <span className="text-sm text-muted-foreground">
          {item.data_de_nascimento ? formatDate(item.data_de_nascimento) : '—'}
        </span>
      ),
    },
    {
      header: 'Idade',
      className: 'whitespace-nowrap text-center',
      cell: (item: AposentadoriaItem) => (
        <span className="text-sm font-medium">
          {item.data_de_nascimento ? getAgeYears(item.data_de_nascimento) : '—'}
        </span>
      ),
    },
    {
      header: 'Sexo',
      className: 'whitespace-nowrap text-center',
      cell: (item: AposentadoriaItem) => (
        <span className="text-sm text-muted-foreground">
          {item.sexo ? (SEXO_LABEL[item.sexo] ?? item.sexo) : '—'}
        </span>
      ),
    },
    {
      header: 'Situação',
      cell: (item: AposentadoriaItem) => {
        const cfg = CATEGORY_CONFIG[item.categoria];
        return <StatusBadge variant={cfg.variant} label={cfg.label} />;
      },
    },
  ];

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Nenhum sócio encontrado para este filtro."
      />
      <div className="border-t px-4 py-3">
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          onPageSizeChange={(v) => pagination.setPageSize(Number(v))}
        />
      </div>
    </div>
  );
}
