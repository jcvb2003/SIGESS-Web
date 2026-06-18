# Code Conventions

## Module structure (per module)

```
modules/<name>/
├── components/   # UI components
├── hooks/
│   ├── data/     # useQuery hooks (read)
│   ├── edit/     # useMutation hooks (write)
│   └── filters/  # filter state hooks
├── services/     # Supabase calls — pure functions, no React
├── types/        # TS interfaces/types
├── queryKeys.ts  # TanStack Query key factory
└── utils/        # Pure utility functions
```

## Data hook pattern

```ts
export function useFooData(params) {
  const { unitId, bootstrapped } = useActiveScope();  // always
  return useQuery({
    queryKey: fooQueryKeys.list({ ...params, _unitId: unitId }),  // unitId in key
    queryFn: () => fooService.list(params, unitId),
    enabled: bootstrapped && !!unitId,  // always gated
  });
}
```

## Service pattern

Services receive `unitId?: string | null` as last param (or inside a context object). Never import `useActiveScope` in service files — services are pure.

## Query key factories

Each module has a `queryKeys.ts` with typed key factories. `_unitId` must be in every key that is unit-scoped.

## Forms

React Hook Form + Zod schema. Validation schema co-located with the form component or in `types/`.

## Error handling

Supabase errors surfaced via `toast.error(...)` (Sonner). Service layer throws typed errors (e.g. `DuplicateCpfError`, `LimitExceededError` in memberService).

## Imports

Path alias `@/` maps to `./src/`. Always use alias for cross-module imports.
