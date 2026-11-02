-- Extend the existing private contact workflow; no contact rows or entity links change.
alter table admin.contacts
  add column offer text,
  add column pipeline_stage text check (pipeline_stage in ('unqualified','discovery_qualified','relationship_hold','contacted','responded','demo_or_quote','offered','won','lost','parked')),
  add column next_action text,
  add column next_contact_at date,
  add column source_url text,
  add column verified_at date;

create or replace view public.v_admin_contacts as
select c.id,c.entity_id,e.name as entity,c.category,c.organization,c.name,c.title,c.email,c.phone,c.address,
  c.jurisdiction,c.notes,c.last_contact_at,c.is_active,c.updated_at,
  c.offer,c.pipeline_stage,c.next_action,c.next_contact_at,c.source_url,c.verified_at
from admin.contacts c left join admin.entities e on e.id=c.entity_id;

-- Preserve the existing guarded writer and its ACL; extend only contacts' allow-list.
do $migration$
declare definition text; amended text;
begin
  select pg_get_functiondef('public.admin_update_row(text,uuid,jsonb)'::regprocedure) into definition;
  amended := replace(definition,'"last_contact_at","is_active"]',
    '"last_contact_at","is_active","offer","pipeline_stage","next_action","next_contact_at","source_url","verified_at"]');
  if amended=definition then raise exception 'contacts writer allow-list did not match expected source'; end if;
  execute amended;
end
$migration$;

notify pgrst, 'reload schema';
