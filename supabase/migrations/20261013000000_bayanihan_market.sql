-- =============================================================================
-- Bayanihan Market: database schema, Row Level Security and Storage setup
--
-- Run this whole file once in the Supabase Dashboard → SQL Editor (or with
-- `supabase db push` if you use the Supabase CLI). It is written to be safe to
-- re-run: types, tables and config rows are created only if missing, and
-- functions, triggers and policies are replaced.
--
-- Security model in short:
--   * Every table has RLS enabled. Anonymous visitors can only read public
--     marketplace data (approved sellers, their shops and active products).
--   * Users can never change their own role or seller approval status: those
--     columns are not granted for UPDATE and a trigger rejects the change.
--   * Only APPROVED sellers in the configured municipality can list products
--     or upload product images. Approval is done by an administrator.
--   * Product images live in the public `product-images` bucket; sellers may
--     only write inside a folder named after their own user id.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('buyer', 'seller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.seller_status as enum ('none', 'pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- Keep in sync with CATEGORIES in src/lib/config.js
do $$ begin
  create type public.product_category as enum (
    'Fresh Produce',
    'Meat & Seafood',
    'Baked Goods & Snacks',
    'Beverages',
    'Handicrafts',
    'Clothing & Accessories',
    'Home & Living',
    'Health & Beauty',
    'Services',
    'Others'
  );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Marketplace configuration (read-only for app users)
-- Keep `municipality` in sync with MUNICIPALITY.name in src/lib/config.js.
-- -----------------------------------------------------------------------------
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  description text
);

insert into public.app_config (key, value, description) values
  ('municipality', 'Donsol', 'The only municipality whose sellers may list products.'),
  ('province', 'Sorsogon', 'Province of the configured municipality (display only).'),
  ('auto_approve_sellers', 'false', 'When true, new seller sign-ups are approved automatically. Use only for local testing.')
on conflict (key) do nothing;

create or replace function public.marketplace_municipality()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select value from public.app_config where key = 'municipality'
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  role public.app_role not null default 'buyer',
  seller_status public.seller_status not null default 'none',
  municipality text check (municipality is null or char_length(municipality) <= 100),
  barangay text check (barangay is null or char_length(barangay) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_status_matches_role check (
    (role = 'buyer' and seller_status = 'none') or
    (role = 'seller' and seller_status <> 'none')
  )
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  shop_name text not null check (char_length(trim(shop_name)) between 2 and 80),
  description text check (description is null or char_length(description) <= 300),
  category public.product_category not null default 'Others',
  municipality text not null,
  barangay text not null check (char_length(trim(barangay)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets products reference (shop_id, seller_id) so a product's shop always belongs to its seller.
  constraint shops_id_owner_key unique (id, owner_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  shop_id uuid not null,
  name text not null check (char_length(trim(name)) between 3 and 80),
  description text not null check (char_length(trim(description)) between 20 and 1000),
  price numeric(10, 2) not null check (price > 0 and price <= 1000000),
  category public.product_category not null,
  stock_quantity integer not null default 0 check (stock_quantity between 0 and 100000),
  image_url text check (image_url is null or image_url ~* '^https?://'),
  -- Storage object path, always inside the seller's own folder: "<seller_id>/<file>".
  image_path text check (image_path is null or image_path like seller_id::text || '/%'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_shop_owner_fkey foreign key (shop_id, seller_id)
    references public.shops (id, owner_id) on delete cascade
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlists_user_product_key unique (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists profiles_role_status_idx on public.profiles (role, seller_status);
create index if not exists shops_municipality_idx on public.shops (municipality);
create index if not exists products_shop_seller_idx on public.products (shop_id, seller_id);
create index if not exists products_seller_idx on public.products (seller_id);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
create index if not exists products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index if not exists wishlists_product_idx on public.wishlists (product_id);

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------

-- True when the user is a seller approved by an admin, located in the configured
-- municipality, and has a shop. SECURITY DEFINER so RLS policies can call it
-- without exposing the profiles table.
create or replace function public.is_approved_seller(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.shops s on s.owner_id = p.id
    where p.id = user_id
      and p.role = 'seller'
      and p.seller_status = 'approved'
      and p.municipality = public.marketplace_municipality()
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Defense in depth on top of column privileges: app users (JWT role anon or
-- authenticated) can never change id, role or seller_status. Admins running SQL
-- in the dashboard (no JWT) can. Sellers are always pinned to the configured municipality.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') in ('anon', 'authenticated') then
    if new.id is distinct from old.id
      or new.role is distinct from old.role
      or new.seller_status is distinct from old.seller_status then
      raise exception 'You cannot change your account type or seller approval status.'
        using errcode = '42501';
    end if;
  end if;

  if new.role = 'seller' then
    new.municipality := public.marketplace_municipality();
  end if;
  return new;
end;
$$;

-- Shops always belong to the configured municipality, and ownership can't move.
create or replace function public.enforce_shop_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.municipality := public.marketplace_municipality();
  if tg_op = 'UPDATE' then
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;

-- Creates the profile (and a seller's shop) when someone signs up.
-- `role` comes from sign-up metadata, which the user controls. Choosing "seller"
-- only creates a PENDING seller: nothing can be listed until an admin approves it
-- (unless auto_approve_sellers is turned on for testing).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.app_role := case when meta ->> 'role' = 'seller' then 'seller' else 'buyer' end;
  v_town text := public.marketplace_municipality();
  v_auto boolean := coalesce(
    (select value = 'true' from public.app_config where key = 'auto_approve_sellers'), false);
  v_category text := meta ->> 'shop_category';
begin
  insert into public.profiles (id, full_name, role, seller_status, municipality, barangay)
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'full_name'), ''), 'New member'),
    v_role,
    case
      when v_role = 'buyer' then 'none'
      when v_auto then 'approved'
      else 'pending'
    end::public.seller_status,
    case when v_role = 'seller' then v_town else nullif(trim(meta ->> 'municipality'), '') end,
    nullif(trim(meta ->> 'barangay'), '')
  );

  if v_role = 'seller'
    and nullif(trim(meta ->> 'shop_name'), '') is not null
    and nullif(trim(meta ->> 'barangay'), '') is not null then
    insert into public.shops (owner_id, shop_name, category, municipality, barangay)
    values (
      new.id,
      trim(meta ->> 'shop_name'),
      case
        when v_category in (select unnest(enum_range(null::public.product_category))::text)
          then v_category
        else 'Others'
      end::public.product_category,
      v_town,
      trim(meta ->> 'barangay')
    );
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

drop trigger if exists shops_enforce_rules on public.shops;
create trigger shops_enforce_rules
  before insert or update on public.shops
  for each row execute function public.enforce_shop_rules();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Privileges: start from nothing, then grant only what the app needs.
-- Column lists stop users from writing role, seller_status, owner/seller ids, etc.
-- -----------------------------------------------------------------------------
revoke all on table public.app_config, public.profiles, public.shops, public.products, public.wishlists
  from anon, authenticated;

grant select on table public.app_config to anon, authenticated;

grant select on table public.profiles to anon, authenticated;
grant update (full_name, municipality, barangay) on table public.profiles to authenticated;

grant select on table public.shops to anon, authenticated;
grant insert (owner_id, shop_name, description, category, barangay) on table public.shops to authenticated;
grant update (shop_name, description, category, barangay) on table public.shops to authenticated;

grant select on table public.products to anon, authenticated;
grant insert (seller_id, shop_id, name, description, price, category, stock_quantity, image_url, image_path, is_active)
  on table public.products to authenticated;
grant update (name, description, price, category, stock_quantity, image_url, image_path, is_active)
  on table public.products to authenticated;
grant delete on table public.products to authenticated;

grant select, delete on table public.wishlists to authenticated;
grant insert (product_id) on table public.wishlists to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.marketplace_municipality() to anon, authenticated;
grant execute on function public.is_approved_seller(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.wishlists enable row level security;

-- app_config: readable by everyone, writable by nobody through the API.
drop policy if exists "Config is readable" on public.app_config;
create policy "Config is readable" on public.app_config
  for select to anon, authenticated
  using (true);

-- profiles: buyers' profiles are private to their owner. Approved sellers' names,
-- municipality and barangay are public business information. Emails stay in auth.users
-- and are never exposed. Profiles are created only by the sign-up trigger.
drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Approved seller profiles are public" on public.profiles;
create policy "Approved seller profiles are public" on public.profiles
  for select to anon, authenticated
  using (role = 'seller' and seller_status = 'approved');

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- shops
drop policy if exists "Approved shops are public" on public.shops;
create policy "Approved shops are public" on public.shops
  for select to anon, authenticated
  using (public.is_approved_seller(owner_id) or owner_id = (select auth.uid()));

drop policy if exists "Sellers create their own shop" on public.shops;
create policy "Sellers create their own shop" on public.shops
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'seller'
    )
  );

drop policy if exists "Sellers update their own shop" on public.shops;
create policy "Sellers update their own shop" on public.shops
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- products
drop policy if exists "Active products from approved sellers are public" on public.products;
create policy "Active products from approved sellers are public" on public.products
  for select to anon, authenticated
  using (
    (is_active and public.is_approved_seller(seller_id))
    or seller_id = (select auth.uid())
  );

drop policy if exists "Approved sellers create their own products" on public.products;
create policy "Approved sellers create their own products" on public.products
  for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and public.is_approved_seller((select auth.uid()))
  );

drop policy if exists "Approved sellers update their own products" on public.products;
create policy "Approved sellers update their own products" on public.products
  for update to authenticated
  using (seller_id = (select auth.uid()))
  with check (
    seller_id = (select auth.uid())
    and public.is_approved_seller((select auth.uid()))
  );

drop policy if exists "Sellers delete their own products" on public.products;
create policy "Sellers delete their own products" on public.products
  for delete to authenticated
  using (seller_id = (select auth.uid()));

-- wishlists: private to each user. You can only save products you are allowed to see.
drop policy if exists "Users read their own wishlist" on public.wishlists;
create policy "Users read their own wishlist" on public.wishlists
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users add to their own wishlist" on public.wishlists;
create policy "Users add to their own wishlist" on public.wishlists
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id)
  );

drop policy if exists "Users remove from their own wishlist" on public.wishlists;
create policy "Users remove from their own wishlist" on public.wishlists
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Realtime: lets open marketplace pages refresh when sellers change listings.
-- Realtime still applies the RLS policies above to every subscriber.
-- -----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.products;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Storage: product-images bucket
-- Public bucket so product photos load from their public URL. Writes are limited
-- by the policies below plus the bucket's own size and MIME type limits.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Approved sellers upload product images" on storage.objects;
create policy "Approved sellers upload product images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_approved_seller((select auth.uid()))
  );

drop policy if exists "Sellers read their own product images" on storage.objects;
create policy "Sellers read their own product images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Sellers update their own product images" on storage.objects;
create policy "Sellers update their own product images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_approved_seller((select auth.uid()))
  );

drop policy if exists "Sellers delete their own product images" on storage.objects;
create policy "Sellers delete their own product images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
