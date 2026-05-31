import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AdministrationSummaryCards,
  MembershipDialog,
  PlanInfoCard,
  TenantUserDialog,
  UnitDialog,
  UnitsManagementSection,
} from "@/modules/administration/components";
import { useAdministrationPage } from "@/modules/administration/hooks/useAdministrationPage";
import { usePermissions } from "@/shared/hooks/usePermissions";

export default function AdministrationPage() {
  const { canAccessTenantAdministration, isTenantAdministrationLoading } = usePermissions();
  const [linkingUnitId, setLinkingUnitId] = useState<string | undefined>(undefined);

  const page = useAdministrationPage(canAccessTenantAdministration);

  if (isTenantAdministrationLoading) return null;
  if (!canAccessTenantAdministration) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <AdministrationSummaryCards
        activeUnitsCount={page.counts.activeUnits}
        operatorsCount={page.counts.activeUsers}
        accessCount={page.counts.memberships}
        totalMembers={page.totalMembers}
        isLoading={page.isLoading.units || page.isLoading.tenantUsers || page.isLoading.memberships}
      />

      <PlanInfoCard />

      <UnitsManagementSection
        units={page.units}
        membershipRows={page.membershipRows}
        unitStats={page.unitStats}
        isLoading={page.isLoading.units || page.isLoading.memberships || page.isLoading.unitStats}
        isDeleting={page.mutations.deleteMembership.isPending}
        onEdit={page.openEditUnit}
        onEnter={page.enterUnit}
        onCreate={page.openCreateUnit}
        onCreateUser={() => page.setTenantUserDialogOpen(true)}
        onLinkOperator={(unitId) => { setLinkingUnitId(unitId); page.setMembershipDialogOpen(true); }}
        onDeleteMembership={(id) => page.mutations.deleteMembership.mutate(id)}
      />

      <UnitDialog
        open={page.unitDialog.open}
        onOpenChange={(open) => { if (!open) page.closeUnitDialog(); else page.openCreateUnit(); }}
        editingUnit={page.unitDialog.editing}
        onSubmit={(values) => page.mutations.saveUnit.mutateAsync(values)}
        isSaving={page.mutations.saveUnit.isPending}
      />

      <MembershipDialog
        open={page.membershipDialogOpen}
        onOpenChange={(open) => { page.setMembershipDialogOpen(open); if (!open) setLinkingUnitId(undefined); }}
        users={page.tenantUsers.filter((u) => u.isActive && u.tenantRole !== "owner")}
        units={page.units.filter((u) => u.isActive)}
        existingMemberships={page.memberships}
        onSubmit={(values) => page.mutations.createMembership.mutateAsync(values)}
        isSaving={page.mutations.createMembership.isPending}
        defaultUnitId={linkingUnitId}
      />

      <TenantUserDialog
        open={page.tenantUserDialogOpen}
        onOpenChange={page.setTenantUserDialogOpen}
        existingEmails={page.tenantUsers.map((u) => u.email ?? "").filter(Boolean)}
        onSubmit={(values) => page.mutations.createTenantUser.mutateAsync(values)}
        isSaving={page.mutations.createTenantUser.isPending}
      />
    </div>
  );
}
