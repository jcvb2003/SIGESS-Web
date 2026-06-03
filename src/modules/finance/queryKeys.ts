import type { FinanceDashboardParams } from "./types/finance.types";

export const financeQueryKeys = {
  all: ["finance"] as const,
  dashboard: (params: FinanceDashboardParams) =>
    [...financeQueryKeys.all, "dashboard", params] as const,
  statement: (cpf: string) =>
    [...financeQueryKeys.all, "statement", cpf] as const,
  settings: (unitId?: string | null) => [...financeQueryKeys.all, "settings", unitId ?? null] as const,
  chargeTypes: (unitId?: string | null) => [...financeQueryKeys.all, "chargeTypes", unitId ?? null] as const,
  generatedCharges: (typeId?: string) =>
    [...financeQueryKeys.all, "generatedCharges", typeId] as const,
  memberConfig: (cpf: string) =>
    [...financeQueryKeys.all, "memberConfig", cpf] as const,
  daeStatus: (cpf: string, year: number, month: number) =>
    [...financeQueryKeys.all, "daeStatus", cpf, year, month] as const,
  financialStatus: (cpf: string, year: number) =>
    [...financeQueryKeys.all, "status", cpf, year] as const,
  stats: (year: number, month: number) =>
    [...financeQueryKeys.all, "stats", year, month] as const,
  tabCounts: (searchTerm: string, year: number, anoBase: number, unitId?: string | null) =>
    [...financeQueryKeys.all, "tabCounts", searchTerm, year, anoBase, unitId ?? null] as const,
};
