import type { FinanceDashboardParams } from "./types/finance.types";

export const financeQueryKeys = {
  all: ["finance"] as const,
  dashboard: (params: FinanceDashboardParams) =>
    [...financeQueryKeys.all, "dashboard", params] as const,
  statement: (cpf: string) =>
    [...financeQueryKeys.all, "statement", cpf] as const,
  settings: () => [...financeQueryKeys.all, "settings"] as const,
  chargeTypes: () => [...financeQueryKeys.all, "chargeTypes"] as const,
  generatedCharges: (typeId?: string) =>
    [...financeQueryKeys.all, "generatedCharges", typeId] as const,
  memberConfig: (cpf: string) =>
    [...financeQueryKeys.all, "memberConfig", cpf] as const,
  financialStatus: (cpf: string, year: number) =>
    [...financeQueryKeys.all, "status", cpf, year] as const,
};
