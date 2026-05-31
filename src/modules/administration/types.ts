import type {
  TenantMembershipRecord,
  TenantUnitRecord,
  TenantUserRecord,
} from "./services/administrationService";

export interface UnitStat {
  sociosCount: number;
  pendingReqCount: number;
}

export interface MembershipRow {
  membership: TenantMembershipRecord;
  user: TenantUserRecord | null;
  unit: TenantUnitRecord | null;
}
