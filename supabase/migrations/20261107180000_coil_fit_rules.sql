-- Which coils fit which devices. A rule names one coil product and a pattern for the devices that take it, so a whole
-- family is covered at once (every Uwell G3, G4, G5 and G6 device takes the G3 coil, and so on). Whenever a product is
-- added or renamed, or a rule changes, the coils' "fits" lists are brought up to date automatically.
-- The rules come from the retailer compatibility guides listed in each note. Add a rule here when a new coil family appears.
create table if not exists public.coil_fit_rules (
  id bigint generated always as identity primary key,
  coil_name text not null,
  device_regex text not null,
  note text not null default '',
  unique (coil_name, device_regex)
);

alter table public.coil_fit_rules enable row level security;
revoke all on table public.coil_fit_rules from anon, authenticated;
grant select, insert, update, delete on table public.coil_fit_rules to authenticated;
grant select, insert, update, delete on table public.coil_fit_rules to service_role;
drop policy if exists "Admins manage fit rules" on public.coil_fit_rules;
create policy "Admins manage fit rules" on public.coil_fit_rules for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Adds every device a rule matches to its coil's fits. It only adds, so a fit chosen by hand in the product form is kept.
create or replace function public.apply_coil_fits()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  with matches as (
    select c.id as coil_id, array_agg(distinct d.id) as device_ids
    from public.products c
    join public.coil_fit_rules r on lower(r.coil_name) = lower(c.name)
    join public.products d on d.category = 'device' and d.name ~* r.device_regex
    where c.category = 'coil'
    group by c.id
  )
  update public.products c
  set fits = (select array_agg(distinct x) from unnest(c.fits || m.device_ids) as x)
  from matches m
  where c.id = m.coil_id and not (c.fits @> m.device_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.apply_coil_fits() from public, anon, authenticated;

create or replace function public.products_apply_fit_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.apply_coil_fits();
  return null;
end;
$$;
revoke all on function public.products_apply_fit_rules() from public, anon, authenticated;

drop trigger if exists products_fit_rules on public.products;
create trigger products_fit_rules
after insert or update of name, category on public.products
for each row execute function public.products_apply_fit_rules();

drop trigger if exists coil_fit_rules_apply on public.coil_fit_rules;
create trigger coil_fit_rules_apply
after insert or update or delete on public.coil_fit_rules
for each statement execute function public.products_apply_fit_rules();

insert into public.coil_fit_rules (coil_name, device_regex, note) values
  ('Uwell - G3 Coils', '^Uwell - (G3|G4|G5|G6|GK3)', 'GPP / G3 pod platform: shared by the G3, G3 Lite, G3 Pro, G4, G4 Mini, G4 Pro, G5 and GK3 kits (Element Vape guide, Vapeuk, Smokz)'),
  ('Uwell - AZ3 Coils', '^Uwell - (A3|AZ3|AK3)', 'Caliburn A3 pods fit the A3, A3S, AK3 and AZ3 (Element Vape A3 pods page, ecigclick review)'),
  ('Oxva - Xlim Coils', '^Oxva[ -]+(Xlim|SQ Pro)', 'Xlim V2, V3 and EZ pods are shared across the Xlim series, Xlim Pro, Pro 2, Go and SQ Pro 2 (retailer listings, plus the owner)'),
  ('Oxva - Nexlim Coils', '^Oxva[ -]+Nexlim', 'Nexlim pods are made for the Nexlim kits (retailer listings)'),
  ('Oxva - Oneo', '^Oxva[ -]+Oneo', 'Oneo pods are made for the Oneo kit (several retailers)'),
  ('Oxva - Vprime', '^Oxva[ -]+Vprime', 'Matched by name: the Vprime coil is the Vprime device''s own (no compatibility page found)'),
  ('Vaporesso - Xros Coils', '^Vaporesso - Xros', 'Xros pods fit the Xros series, 5 Mini, Nano and Pro (Element Vape, Vapeuk, ecigarettedirect). Retailers disagree about 0.4 ohm pods on some models'),
  ('Vaporesso - Luxe Q2', '^Vaporesso - Luxe Q', 'Luxe Q pods fit the Luxe Q, Q2, Q2 SE and QS (Element Vape Luxe Q pods)'),
  ('Vaporesso - GTX Luxe xr max', '^Vaporesso - Luxe XR', 'Matched by name: the GTX Luxe XR Max coil for the Luxe XR Max'),
  ('Vaporesso - Vibe Coils', '^Vaporesso - Vibe', 'Matched by name: Vibe pods for the Vibe and Vibe SE kits'),
  ('Voopoo - Vmate', '^Voopoo - Vmate', 'Vmate V2 pods are listed for the whole Vmate range: Vmate, E, Pro, Infinity, Max (Vape Club). Mini and Pro 2 are matched by family'),
  ('Voopoo - Argus', '^Voopoo - (Argus|G2 Mini)', 'Argus pods and cartridges fit the Argus A, Z2, G3 and G3 Mini, Matrix and G2 Mini (Element Vape, ecigone). Some retailers say the G3 takes PnP X coils instead'),
  ('Geek Vape - Sonder', '^Geek Vape - Sonder', 'The Sonder Q2 takes the Geekvape Q pod cartridges (vapeuk, Vaping360)'),
  ('Smoke - Zrex', '^Smoke - Zrex', 'Matched by name: the Zrex coil for the Zrex kit')
on conflict (coil_name, device_regex) do nothing;

select public.apply_coil_fits();
