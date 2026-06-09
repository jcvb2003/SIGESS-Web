begin;

drop policy if exists templates_insert on public.templates;
create policy templates_insert
on public.templates
for insert
to authenticated
with check (
  public.is_tenant_owner(tenant_id)
  or exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = templates.tenant_id
      and tu.user_id = auth.uid()
      and tu.is_active = true
      and (tu.tenant_role = 'owner' or tu.operator_type = 'presidente')
  )
);

drop policy if exists templates_delete on public.templates;
create policy templates_delete
on public.templates
for delete
to authenticated
using (
  public.is_tenant_owner(tenant_id)
  or exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = templates.tenant_id
      and tu.user_id = auth.uid()
      and tu.is_active = true
      and (tu.tenant_role = 'owner' or tu.operator_type = 'presidente')
  )
);

commit;
