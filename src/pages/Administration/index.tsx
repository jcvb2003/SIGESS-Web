import { Navigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  AdministrationSummaryCards,
  MembershipDialog,
  MembershipsSection,
  PolosBreakdownSection,
  TenantUserDialog,
  TenantUsersSection,
  UnitDialog,
  UnitsSection,
} from "@/modules/administration/components";
import { useAdministrationPage } from "@/modules/administration/hooks/useAdministrationPage";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/button";
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
        actions={
          <Button onClick={page.openCreateUnit} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo polo
          </Button>
        }
      />

      <AdministrationSummaryCards
        unitsCount={page.counts.totalUnits}
        activeUnitsCount={page.counts.activeUnits}
        operatorsCount={page.counts.activeUsers}
        accessCount={page.counts.memberships}
        totalMembers={page.totalMembers}
        pendingRequirements={page.pendingRequirements}
        defaulters={page.defaulters}
      />

      <PolosBreakdownSection
        units={page.units}
        memberships={page.memberships}
        unitStats={page.unitStats}
        isLoading={page.isLoading.units || page.isLoading.memberships || page.isLoading.unitStats}
      />

      <UnitsSection
        units={page.units}
        isLoading={page.isLoading.units}
        isToggling={page.mutations.toggleUnit.isPending}
        onToggle={(unit) => page.mutations.toggleUnit.mutate(unit)}
        onEdit={page.openEditUnit}
        onEnter={page.enterUnit}
      />

      <TenantUsersSection
        tenantUsers={page.tenantUsers}
        isLoading={page.isLoading.tenantUsers}
        onCreate={() => page.setTenantUserDialogOpen(true)}
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
