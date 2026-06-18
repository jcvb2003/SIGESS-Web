# Tenant/Unit Runtime Architecture

## Scope resolution flow

`TenantUnitBootstrapper` (mounts once on auth) → `tenantUnitService.resolveTenantUnits(user)` → `getUserAssignedUnitsFromSharedProject`:
- **Gestor** (`tenant_role = 'owner'`): fetches all active `tenant_units` for the tenant
- **Operador**: fetches `user_unit_memberships` → extracts unit_ids → fetches those units

Result stored in `TenantUnitContext` (React Context + localStorage, scoped per tenantCode: `sigess_active_unit_{code}`, `sigess_available_units_{code}`).

## Key flags

- **`hydrated`**: localStorage read complete (immediate, pre-DB). Used by skeleton loaders.
- **`bootstrapped`**: DB resolution complete (all branches including error). Used by query gates and portal discriminator.

## Portal discriminator (`usePortalContext`)

```ts
isStatePortal       = canAccessTenantAdministration && bootstrapped && !activeUnit
isOperationalPortal = bootstrapped && !isStatePortal && availableUnits.length > 0
```

- Gestor without activeUnit → `isStatePortal` → `/administration`
- Anyone with activeUnit → `isOperationalPortal` → `/dashboard`

## Route guards (router/index.tsx)

Two layout shells:
1. `TenantAdministrationLayout` — `/administration` only. Guards: `!session → /auth`, `!isStatePortal → /dashboard`
2. `DashboardLayout` — all operational routes. Guards: `!session → /auth`, `isStatePortal → /administration`, `hasMultipleUnits && !activeUnit → /select-unit`

Public routes (no auth): `/foto-upload`, `/ficha-socio/:id`, `/carteirinha/:id`, `/password`

## Canonical scope hook

`useActiveScope()` in `src/shared/hooks/useActiveScope.ts` returns `{ unitId, tenantId, bootstrapped }`.
**All feature hooks must use this.** Never call `useTenantUnits()` directly in feature modules.

## Structural debt (open)

- No central enforcement that new services receive `unitId` — discipline risk
- No regression tests for unit isolation
- No test infrastructure at all
