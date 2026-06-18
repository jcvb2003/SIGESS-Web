# Web — Core

Multi-tenant SaaS React app for fishing cooperative management.

## Source map

```
src/
├── main.tsx              # Entry: DOM protection + chunk error recovery
├── app/
│   ├── providers/        # QueryClient, Auth, Theme, Supabase context
│   ├── router/index.tsx  # React Router v7 route definitions (2 layout shells)
│   └── styles/
├── modules/              # Domain logic (hooks, services, types per domain)
│   ├── administration/   # Gestor portal (management view)
│   ├── auth/             # Login, idle timeout, user metadata
│   ├── automation/       # REAP bulk automation
│   ├── billing/          # Billing summary + portal token (Web-facing)
│   ├── dashboard/        # Dashboard aggregation
│   ├── documents/        # PDF generation, templates, defeso requests
│   ├── finance/          # Lançamentos, DAE, charges, config, history
│   ├── members/          # Sócios CRUD, photo, localities, portarias
│   ├── reap/             # REAP form automation
│   ├── reports/          # Requirements report
│   ├── requirements/     # Requerimentos
│   ├── settings/         # Entity, parameters, user management, extension
│   └── tenant-units/     # TenantUnitContext, Bootstrapper, service
├── pages/                # Thin page components consuming modules
└── shared/
    ├── components/       # UI components (layout, dialogs, tables)
    ├── context/          # PortariaContext
    ├── hooks/            # useActiveScope (canonical scope hook), useDataTableState, etc.
    ├── lib/              # Supabase client + database.types
    ├── services/         # Base service response pattern, logger
    ├── types/            # Shared TS types
    └── utils/
```

## Project-wide invariants

- **`useActiveScope()`** is the canonical hook for `{ unitId, tenantId, bootstrapped }` — all data hooks must use it, never call `useTenantUnits()` directly in feature modules.
- **`enabled: bootstrapped && !!unitId`** — queries must be gated on both flags or they fire before unit is resolved.
- Query keys must include `_unitId` to prevent cross-unit cache pollution.
- RLS enforces isolation at DB level; frontend filtering is for UX only, but must be consistent.
- Path alias `@/` → `./src/`.

See `mem:tenant_unit_architecture` for full scope/unit runtime details.
See `mem:tech_stack` for dependencies.
See `mem:conventions` for code patterns.
