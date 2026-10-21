-- =============================================================================
-- Bayanihan Market: sell products by the piece or by the kilo
--
-- Run this once in the Supabase SQL Editor, after the earlier migrations.
-- Safe to re-run.
--
--   unit         'piece' (default) or 'kg'
--   price        price per piece, or price per kilo when unit = 'kg'
--   stock_quantity  pieces available, or kilos available (up to 2 decimals) when unit = 'kg'
--   weight_step  smallest weight a buyer can order, and the step between weights:
--                0.25 (¼ kg), 0.5 (½ kg) or 1 (1 kg). Always 1 for 'piece'.
-- =============================================================================

alter table public.products
  add column if not exists unit text not null default 'piece',
  add column if not exists weight_step numeric(4, 2) not null default 1;

-- Kilos need decimals (e.g. 12.5 kg); pieces stay whole numbers (checked below).
alter table public.products
  alter column stock_quantity type numeric(10, 2);

alter table public.products drop constraint if exists products_unit_check;
alter table public.products add constraint products_unit_check
  check (unit in ('piece', 'kg'));

alter table public.products drop constraint if exists products_weight_step_check;
alter table public.products add constraint products_weight_step_check check (
  (unit = 'piece' and weight_step = 1) or
  (unit = 'kg' and weight_step in (0.25, 0.5, 1))
);

alter table public.products drop constraint if exists products_piece_stock_whole_check;
alter table public.products add constraint products_piece_stock_whole_check
  check (unit <> 'piece' or stock_quantity = trunc(stock_quantity));

-- Sellers may set the new columns on their own products (RLS policies are unchanged).
grant insert (unit, weight_step) on table public.products to authenticated;
grant update (unit, weight_step) on table public.products to authenticated;
