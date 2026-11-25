begin;

-- Public links outlive the rotating reply inbox. Only first-party content pages
-- may be destinations. A published code is never recycled or updated.
create function public.kc_shareable_reply_url(target text) returns boolean
language sql immutable strict set search_path = '' as $$
  select length(target) <= 2048
    and target ~ '^https://kineticclinician[.]com/(j|jobs|employers|training|resources|pathways|nurse|ems|calculator|[a-z]{2})(/|[?#]|$)'
    and target !~ '[[:space:][:cntrl:]]'
    and position(chr(92) in target) = 0
    and target !~* '(%(00|0a|0d|2e|2f|5c)|/\.{1,2}(/|[?#]|$))';
$$;

create table public.kc_reply_short_links (
  code text primary key check (code ~ '^[0-9a-f]{10,64}$'),
  destination text not null unique check (public.kc_shareable_reply_url(destination))
);
alter table public.kc_reply_short_links enable row level security;
revoke all on public.kc_reply_short_links from public, anon, authenticated, service_role;
grant select, insert on public.kc_reply_short_links to service_role;

create function public.kc_shorten_reply_links() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  entry jsonb;
  result jsonb := '[]';
  target text;
  hash text;
  slug text;
  width integer;
  prefix constant text := 'https://kineticclinician.com/r/';
begin
  if jsonb_typeof(new.job_links) is distinct from 'array' then return new; end if;
  for entry in select value from jsonb_array_elements(new.job_links)
  loop
    if jsonb_typeof(entry) = 'object' then
      entry := entry - 'share_url';
      target := entry->>'url';
      if length(target) > length(prefix) + 10 and public.kc_shareable_reply_url(target) then
        select code into slug from public.kc_reply_short_links where destination = target;
        if slug is null then
          hash := encode(sha256(convert_to(target, 'UTF8')), 'hex');
          for width in 10..64 loop
            exit when length(prefix) + width >= length(target);
            insert into public.kc_reply_short_links (code, destination) values (left(hash,width),target)
              on conflict do nothing returning code into slug;
            if slug is null then
              select code into slug from public.kc_reply_short_links where destination = target;
            end if;
            exit when slug is not null;
          end loop;
        end if;
        if slug is not null then
          entry := entry || jsonb_build_object('share_url',prefix || slug);
        end if;
      end if;
    end if;
    result := result || jsonb_build_array(entry);
  end loop;
  new.job_links := result;
  return new;
end;
$$;
revoke all on function public.kc_shareable_reply_url(text), public.kc_shorten_reply_links() from public, anon, authenticated;
grant execute on function public.kc_shareable_reply_url(text) to service_role;
create trigger kc_shorten_reply_links before insert or update of job_links on public.kc_fb_replies
for each row execute function public.kc_shorten_reply_links();

update public.kc_fb_replies set job_links=job_links where jsonb_typeof(job_links)='array' and job_links <> '[]'::jsonb;
commit;
