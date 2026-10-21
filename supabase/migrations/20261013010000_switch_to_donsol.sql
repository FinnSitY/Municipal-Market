-- =============================================================================
-- Bayanihan Market: switch the marketplace municipality to Donsol, Sorsogon
--
-- Run this once in the Supabase SQL Editor, after the main migration.
-- Must match MUNICIPALITY in src/lib/config.js.
-- =============================================================================

update public.app_config set value = 'Donsol' where key = 'municipality';
update public.app_config set value = 'Sorsogon' where key = 'province';

-- Re-pin existing sellers and shops to the new municipality. The shops trigger
-- sets municipality from app_config on every update.
update public.profiles set municipality = public.marketplace_municipality() where role = 'seller';
update public.shops set municipality = public.marketplace_municipality();

-- Check: should show Donsol / Sorsogon, and 0 shops outside Donsol.
select
  (select value from public.app_config where key = 'municipality') as municipality,
  (select value from public.app_config where key = 'province') as province,
  (select count(*) from public.shops where municipality <> 'Donsol') as shops_outside_donsol;
