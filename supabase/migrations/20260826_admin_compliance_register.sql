-- Applied to bniuiwbwumpymxiesyyt on 2026-08-26 via Supabase MCP (migration name: admin_compliance_register).
-- Compliance / operations register in schema admin: contacts, people, credentials, licenses,
-- insurance_policies, obligations, obligation_events, documents, and view admin.v_due_items.
-- Source of truth is the database; this file is the reproducible schema copy.
-- Query the live schema for column detail:  \d admin.*

-- 2026-08-29 (migration name: public_view_admin_due_items) — admin is not an exposed PostgREST
-- schema, so the cockpit reads through a service_role-only public wrapper:
create or replace view public.v_admin_due_items with (security_invoker = false) as
  select entity_id, entity, kind, item, jurisdiction, due_on, days_left, status,
         fee_usd, alert_days_before, ref_id
  from admin.v_due_items;
revoke all on public.v_admin_due_items from anon, authenticated, public;
grant select on public.v_admin_due_items to service_role;
