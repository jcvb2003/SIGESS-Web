import { Navigate } from "react-router-dom";
import {
  AdministrationSummaryCards,
  MembershipDialog,
  MembershipsSection,
  TenantUserDialog,
  TenantUsersSection,
  UnitDialog,
  UnitsManagementSection,
} from "@/modules/administration/components";
import { useAdministrationPage } from "@/modules/administration/hooks/useAdministrationPage";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { usePermissions } from "@/shared/hooks/usePermissions";

export default function AdministrationPage() {
  const { canAccessTenantAdministration, isTenantAdministrationLoading } = usePermissions();

  const page = useAdministrationPage(canAccessTenantAdministration);

  if (isTenantAdministrationLoading) return null;
  if (!canAccessTenantAdministration) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Portal do Gestor"
        description="Gerencie os polos, operadores e acessos da entidade."
      />

      <AdministrationSummaryCards
        unitsCount={page.counts.totalUnits}
        activeUnitsCount={page.counts.activeUnits}
        operatorsCount={page.counts.activeUsers}
        accessCount={page.counts.memberships}
        totalMembers={page.totalMembers}
        pendingRequirements={page.pendingRequirements}
        defaulters={page.defaulters}
        isLoading={page.isLoading.units || page.isLoading.tenantUsers || page.isLoading.memberships}
      />

      <UnitsManagementSection
        units={page.units}
        memberships={page.memberships}
        unitStats={page.unitStats}
        isLoading={page.isLoading.units || page.isLoading.memberships || page.isLoading.unitStats}
        isToggling={page.mutations.toggleUnit.isPending}
        onToggle={(unit) => page.mutations.toggleUnit.mutate(unit)}
        onEdit={page.openEditUnit}
        onEnter={page.enterUnit}
        onCreate={page.openCreateUnit}
      />

      <TenantUsersSection
        tenantUsers={page.tenantUsers}
        isLoading={page.isLoading.tenantUsers}
        isToggling={page.mutations.toggleTenantUser.isPending}
        onCreate={() => page.setTenantUserDialogOpen(true)}
        onToggle={(user) => page.mutations.toggleTenantUser.mutate(user)}
      />

      <MembershipsSection
        membershipRows={page.membershipRows}
        isLoading={page.isLoading.memberships}
        isDeleting={page.mutations.deleteMembership.isPending}
        onCreate={() => page.setMembershipDialogOpen(true)}
        onDelete={(id) => page.mutations.deleteMembership.mutate(id)}
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
        onOpenChange={page.setMembershipDialogOpen}
        users={page.tenantUsers.filter((u) => u.isActive && u.tenantRole !== "owner")}
        units={page.units.filter((u) => u.isActive)}
        existingMemberships={page.memberships}
        onSubmit={(values) => page.mutations.createMembership.mutateAsync(values)}
        isSaving={page.mutations.createMembership.isPending}
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
