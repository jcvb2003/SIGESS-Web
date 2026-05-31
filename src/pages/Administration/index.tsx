import { Navigate } from "react-router-dom";
import {
  AdministrationSummaryCards,
  PlanInfoCard,
  UnitDialog,
  UnitsManagementSection,
} from "@/modules/administration/components";
import { useAdministrationPage } from "@/modules/administration/hooks/useAdministrationPage";
import { usePermissions } from "@/shared/hooks/usePermissions";

export default function AdministrationPage() {
  const { canAccessTenantAdministration, isTenantAdministrationLoading } = usePermissions();
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
        tenantUsers={page.tenantUsers}
        membershipRows={page.membershipRows}
        memberships={page.memberships}
        unitStats={page.unitStats}
        isLoading={page.isLoading.units || page.isLoading.memberships || page.isLoading.unitStats}
        isDeleting={page.mutations.deleteMembership.isPending}
        isSavingMembership={page.mutations.createMembership.isPending}
        isSavingUser={page.mutations.createTenantUser.isPending}
        onEdit={page.openEditUnit}
        onEnter={page.enterUnit}
        onCreate={page.openCreateUnit}
        onDeleteMembership={(id) => page.mutations.deleteMembership.mutate(id)}
        onCreateMembership={page.mutations.createMembership.mutateAsync}
        onCreateUser={page.mutations.createTenantUser.mutateAsync}
        onSetUserActive={(id, isActive) => page.mutations.setTenantUserActive.mutate({ id, isActive })}
        onDeleteUser={(id) => page.mutations.deleteTenantUser.mutate(id)}
        isTogglingUser={page.mutations.setTenantUserActive.isPending}
        isDeletingUser={page.mutations.deleteTenantUser.isPending}
      />

      <UnitDialog
        open={page.unitDialog.open}
        onOpenChange={(open) => { if (!open) page.closeUnitDialog(); else page.openCreateUnit(); }}
        editingUnit={page.unitDialog.editing}
        onSubmit={(values) => page.mutations.saveUnit.mutateAsync(values)}
        isSaving={page.mutations.saveUnit.isPending}
      />
    </div>
  );
}
