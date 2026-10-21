-- =============================================================================
-- Bayanihan Market: cart checkout and orders
--
-- Run this once in the Supabase SQL Editor, after the earlier migrations.
-- Safe to re-run.
--
-- How it stays trustworthy:
--   * The browser never writes orders directly. It calls place_order(), which
--     re-reads prices from the database, checks stock, weight steps and seller
--     approval, deducts stock, and creates one order per shop, all in one transaction.
--   * Status changes go through update_order_status(), which only allows valid
--     steps (seller: confirm → ready → complete; buyer: cancel while pending) and
--     puts stock back when an order is cancelled.
--   * Buyers see only their own orders; sellers see only orders for their shop.
--   * Payment is cash on pickup or delivery; no payment data is stored.
-- =============================================================================

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity (start with 1001) unique,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  shop_id uuid not null references public.shops (id) on delete cascade,
  -- Snapshots so the order stays readable even if names change later.
  buyer_name text not null,
  shop_name text not null,
  status public.order_status not null default 'pending',
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  contact_phone text not null check (contact_phone ~ '^(09|\+639)[0-9]{9}$'),
  delivery_barangay text check (delivery_barangay is null or char_length(delivery_barangay) <= 100),
  delivery_address text check (delivery_address is null or char_length(delivery_address) <= 200),
  note text check (note is null or char_length(note) <= 300),
  total numeric(12, 2) not null check (total >= 0),
  cancelled_by text check (cancelled_by in ('buyer', 'seller')),
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_delivery_details check (
    fulfillment = 'pickup' or (delivery_barangay is not null and delivery_address is not null)
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit text not null check (unit in ('piece', 'kg')),
  unit_price numeric(10, 2) not null check (unit_price > 0),
  quantity numeric(10, 2) not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index if not exists orders_buyer_created_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_status_idx on public.orders (seller_id, status, created_at desc);
create index if not exists orders_shop_idx on public.orders (shop_id);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- place_order(items, ...) → [{ id, order_no, shop_name, total }]
-- items: [{ "product_id": "<uuid>", "quantity": 1.5 }, ...]
-- -----------------------------------------------------------------------------
create or replace function public.place_order(
  p_items jsonb,
  p_fulfillment text,
  p_contact_phone text,
  p_delivery_barangay text default null,
  p_delivery_address text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_buyer_name text;
  v_phone text := regexp_replace(coalesce(p_contact_phone, ''), '[\s-]', '', 'g');
  v_item jsonb;
  v_product public.products%rowtype;
  v_shop_name text;
  v_qty numeric;
  v_lines jsonb := '[]'::jsonb;
  v_group record;
  v_order_id uuid;
  v_order_no bigint;
  v_total numeric;
  v_result jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Please sign in to place an order.' using errcode = '42501';
  end if;
  select full_name into v_buyer_name from public.profiles where id = v_uid;
  if v_buyer_name is null then
    raise exception 'Your account profile is missing.' using errcode = '42501';
  end if;

  if p_fulfillment not in ('pickup', 'delivery') then
    raise exception 'Choose pickup or delivery.' using errcode = '22023';
  end if;
  if v_phone !~ '^(09|\+639)[0-9]{9}$' then
    raise exception 'Enter a valid PH mobile number, like 0917 123 4567.' using errcode = '22023';
  end if;
  if p_fulfillment = 'delivery'
    and (nullif(trim(coalesce(p_delivery_barangay, '')), '') is null
      or nullif(trim(coalesce(p_delivery_address, '')), '') is null) then
    raise exception 'Enter the barangay and address for delivery.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many items in one order (max 50).' using errcode = '22023';
  end if;

  -- Lock products in a stable order (avoids deadlocks), validate, and deduct stock.
  for v_item in
    select value from jsonb_array_elements(p_items) order by value ->> 'product_id'
  loop
    begin
      v_qty := round((v_item ->> 'quantity')::numeric, 2);
    exception when others then
      raise exception 'Invalid quantity in your cart.' using errcode = '22023';
    end;

    select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid
      for update;

    if not found or not v_product.is_active or not public.is_approved_seller(v_product.seller_id) then
      raise exception 'An item in your cart is no longer available. Please review your cart.' using errcode = 'P0001';
    end if;
    if v_product.seller_id = v_uid then
      raise exception 'You can’t order your own product "%".', v_product.name using errcode = 'P0001';
    end if;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Choose a quantity for "%".', v_product.name using errcode = '22023';
    end if;
    if v_product.unit = 'kg' then
      if mod(v_qty, v_product.weight_step) <> 0 then
        raise exception '"%" is sold in steps of % kg.', v_product.name, v_product.weight_step using errcode = '22023';
      end if;
    elsif v_qty <> trunc(v_qty) then
      raise exception '"%" is sold per piece.', v_product.name using errcode = '22023';
    end if;
    if v_qty > v_product.stock_quantity then
      raise exception 'Only % % of "%" left.',
        v_product.stock_quantity, case when v_product.unit = 'kg' then 'kg' else 'pcs' end, v_product.name
        using errcode = 'P0001';
    end if;

    update public.products set stock_quantity = stock_quantity - v_qty where id = v_product.id;

    select shop_name into v_shop_name from public.shops where id = v_product.shop_id;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit', v_product.unit,
      'unit_price', v_product.price,
      'quantity', v_qty,
      'line_total', round(v_product.price * v_qty, 2),
      'shop_id', v_product.shop_id,
      'seller_id', v_product.seller_id,
      'shop_name', v_shop_name
    );
  end loop;

  -- One order per shop.
  for v_group in
    select distinct (l ->> 'shop_id')::uuid as shop_id, (l ->> 'seller_id')::uuid as seller_id, l ->> 'shop_name' as shop_name
    from jsonb_array_elements(v_lines) l
  loop
    select coalesce(sum((l ->> 'line_total')::numeric), 0) into v_total
    from jsonb_array_elements(v_lines) l
    where (l ->> 'shop_id')::uuid = v_group.shop_id;

    insert into public.orders (
      buyer_id, seller_id, shop_id, buyer_name, shop_name, fulfillment, contact_phone,
      delivery_barangay, delivery_address, note, total
    ) values (
      v_uid, v_group.seller_id, v_group.shop_id, v_buyer_name, v_group.shop_name, p_fulfillment, v_phone,
      case when p_fulfillment = 'delivery' then trim(p_delivery_barangay) end,
      case when p_fulfillment = 'delivery' then trim(p_delivery_address) end,
      nullif(trim(coalesce(p_note, '')), ''),
      v_total
    )
    returning id, order_no into v_order_id, v_order_no;

    insert into public.order_items (order_id, product_id, product_name, unit, unit_price, quantity, line_total)
    select v_order_id, (l ->> 'product_id')::uuid, l ->> 'product_name', l ->> 'unit',
           (l ->> 'unit_price')::numeric, (l ->> 'quantity')::numeric, (l ->> 'line_total')::numeric
    from jsonb_array_elements(v_lines) l
    where (l ->> 'shop_id')::uuid = v_group.shop_id;

    v_result := v_result || jsonb_build_object(
      'id', v_order_id, 'order_no', v_order_no, 'shop_name', v_group.shop_name, 'total', v_total);
  end loop;

  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- update_order_status(order, status, reason)
--   seller: pending → confirmed → ready → completed; may cancel before completion
--   buyer:  may cancel only while pending
-- Cancelling returns the items to stock.
-- -----------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_reason text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders%rowtype;
  v_is_seller boolean;
  v_allowed boolean;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_uid is null or v_uid not in (v_order.buyer_id, v_order.seller_id) then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  v_is_seller := v_uid = v_order.seller_id;

  v_allowed := case
    when v_is_seller then
      (v_order.status = 'pending' and p_status in ('confirmed', 'cancelled')) or
      (v_order.status = 'confirmed' and p_status in ('ready', 'cancelled')) or
      (v_order.status = 'ready' and p_status in ('completed', 'cancelled'))
    else
      v_order.status = 'pending' and p_status = 'cancelled'
  end;

  if not v_allowed then
    raise exception 'This order can’t be changed from "%" to "%".', v_order.status, p_status using errcode = 'P0001';
  end if;

  if p_status = 'cancelled' then
    update public.products p
    set stock_quantity = p.stock_quantity + i.quantity
    from public.order_items i
    where i.order_id = v_order.id and i.product_id = p.id;
  end if;

  update public.orders
  set status = p_status,
      cancelled_by = case when p_status = 'cancelled' then (case when v_is_seller then 'seller' else 'buyer' end) end,
      cancel_reason = case when p_status = 'cancelled' then nullif(left(trim(coalesce(p_reason, '')), 300), '') end
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privileges and RLS: read-only tables for app users; writes only via the functions.
-- -----------------------------------------------------------------------------
revoke all on table public.orders, public.order_items from anon, authenticated;
grant select on table public.orders, public.order_items to authenticated;

revoke all on function public.place_order(jsonb, text, text, text, text, text) from public, anon;
revoke all on function public.update_order_status(uuid, public.order_status, text) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, text, text) to authenticated;
grant execute on function public.update_order_status(uuid, public.order_status, text) to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Buyers and sellers read their orders" on public.orders;
create policy "Buyers and sellers read their orders" on public.orders
  for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

drop policy if exists "Order items follow their order" on public.order_items;
create policy "Order items follow their order" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))
    )
  );

-- Live order updates for buyers and sellers (Realtime applies the RLS above).
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

notify pgrst, 'reload schema';
