begin;

-- Backfill memberships for shared tenants that operate with exactly one active unit.
-- This covers users created before the flow started attaching the technical unit.
with single_unit_tenants as (
  select
    tu.tenant_id,
    (array_agg(tu.id order by tu.created_at nulls last, tu.id))[1] as unit_id
  from public.tenant_units tu
  where coalesce(tu.is_active, true) = true
  group by tu.tenant_id
  having count(*) = 1
)
insert into public.user_unit_memberships (user_id, tenant_id, unit_id, is_active)
select
  tenant_user.user_id,
  tenant_user.tenant_id,
  single_unit.unit_id,
  true
from public.tenant_users tenant_user
join single_unit_tenants single_unit
  on single_unit.tenant_id = tenant_user.tenant_id
where tenant_user.is_active = true
  and not exists (
    select 1
    from public.user_unit_memberships membership
    where membership.user_id = tenant_user.user_id
      and membership.tenant_id = tenant_user.tenant_id
      and membership.unit_id = single_unit.unit_id
  );

-- Remove duplicate configuration rows per technical unit, preserving the oldest row.
with ranked_configs as (
  select
    id,
    row_number() over (partition by unit_id order by id) as row_number
  from public.configuracao_entidade
  where unit_id is not null
)
delete from public.configuracao_entidade config
using ranked_configs ranked
where config.id = ranked.id
  and ranked.row_number > 1;

-- Prevent future duplicates for unit-scoped configuration rows.
create unique index if not exists configuracao_entidade_unit_id_unique
  on public.configuracao_entidade (unit_id)
  where unit_id is not null;

commit;
