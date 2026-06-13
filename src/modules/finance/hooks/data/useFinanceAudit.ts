import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { resolveTenantIdViaTenantUsers } from "@/shared/utils/tenant";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string;
  user_nome: string;
  user_email: string;
  created_at: string;
}

interface UseFinanceAuditOptions {
  tableName?: string;
  operation?: string;
  limit?: number;
  offset?: number;
}

export function useFinanceAudit(options: UseFinanceAuditOptions = {}) {
  const {
    tableName,
    operation,
    limit = 50,
    offset = 0
  } = options;

  const { unitId, bootstrapped } = useActiveScope();

  return useQuery({
    queryKey: ["finance-audit-log", tableName, operation, limit, offset, unitId],
    queryFn: async () => {
      const tenantId = await resolveTenantIdViaTenantUsers();
      if (!tenantId) throw new Error("Tenant não identificado para auditoria financeira.");

      const { data, error } = await supabase.rpc("get_finance_audit_log_v1", {
        p_tenant_id: tenantId,
        p_unit_id: unitId,
        p_table_name: tableName,
        p_operation: operation,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;
      return (data as AuditLogEntry[]) || [];
    },
    staleTime: 0,
    enabled: bootstrapped && !!unitId,
  });
}
