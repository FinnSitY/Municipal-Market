insert into public.app_config (key, value, description) values
  ('center_lat', '12.9083', 'Latitude of the municipality centre (map default).'),
  ('center_lng', '123.5981', 'Longitude of the municipality centre (map default).'),
  ('service_radius_km', '15', 'Shop and delivery pins must be within this distance of the centre.')
on conflict (key) do nothing;


create or replace function public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

create or replace function public.in_service_area(lat double precision, lng double precision)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lat between -90 and 90 and lng between -180 and 180
    and public.distance_km(
      lat, lng,
      (select value::double precision from public.app_config where key = 'center_lat'),
      (select value::double precision from public.app_config where key = 'center_lng')
    ) <= (select value::double precision from public.app_config where key = 'service_radius_km')
$$;

grant execute on function public.distance_km(double precision, double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.in_service_area(double precision, double precision) to anon, authenticated;


alter table public.shops
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.shops drop constraint if exists shops_location_pair_check;
alter table public.shops add constraint shops_location_pair_check
  check ((latitude is null) = (longitude is null));

create or replace function public.validate_shop_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.latitude is not null and not public.in_service_area(new.latitude, new.longitude) then
    raise exception 'Your shop pin must be inside % (the marketplace service area).',
      (select value from public.app_config where key = 'municipality')
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists shops_validate_location on public.shops;
create trigger shops_validate_location
  before insert or update of latitude, longitude on public.shops
  for each row execute function public.validate_shop_location();

grant insert (latitude, longitude) on table public.shops to authenticated;
grant update (latitude, longitude) on table public.shops to authenticated;


alter table public.orders
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;

alter table public.orders drop constraint if exists orders_delivery_location_pair_check;
alter table public.orders add constraint orders_delivery_location_pair_check
  check ((delivery_lat is null) = (delivery_lng is null));


drop function if exists public.place_order(jsonb, text, text, text, text, text);

create or replace function public.place_order(
  p_items jsonb,
  p_fulfillment text,
  p_contact_phone text,
  p_delivery_barangay text default null,
  p_delivery_address text default null,
  p_note text default null,
  p_delivery_lat double precision default null,
  p_delivery_lng double precision default null
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
  if p_fulfillment = 'delivery' then
    if nullif(trim(coalesce(p_delivery_barangay, '')), '') is null
      or nullif(trim(coalesce(p_delivery_address, '')), '') is null then
      raise exception 'Enter the barangay and address for delivery.' using errcode = '22023';
    end if;
    if p_delivery_lat is null or p_delivery_lng is null then
      raise exception 'Pin your delivery location on the map.' using errcode = '22023';
    end if;
    if not public.in_service_area(p_delivery_lat, p_delivery_lng) then
      raise exception 'Your delivery pin is outside the delivery area.' using errcode = '22023';
    end if;
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many items in one order (max 50).' using errcode = '22023';
  end if;

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

  for v_group in
    select distinct (l ->> 'shop_id')::uuid as shop_id, (l ->> 'seller_id')::uuid as seller_id, l ->> 'shop_name' as shop_name
    from jsonb_array_elements(v_lines) l
  loop
    select coalesce(sum((l ->> 'line_total')::numeric), 0) into v_total
    from jsonb_array_elements(v_lines) l
    where (l ->> 'shop_id')::uuid = v_group.shop_id;

    insert into public.orders (
      buyer_id, seller_id, shop_id, buyer_name, shop_name, fulfillment, contact_phone,
      delivery_barangay, delivery_address, delivery_lat, delivery_lng, note, total
    ) values (
      v_uid, v_group.seller_id, v_group.shop_id, v_buyer_name, v_group.shop_name, p_fulfillment, v_phone,
      case when p_fulfillment = 'delivery' then trim(p_delivery_barangay) end,
      case when p_fulfillment = 'delivery' then trim(p_delivery_address) end,
      case when p_fulfillment = 'delivery' then p_delivery_lat end,
      case when p_fulfillment = 'delivery' then p_delivery_lng end,
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

revoke all on function public.place_order(jsonb, text, text, text, text, text, double precision, double precision) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, text, text, double precision, double precision) to authenticated;

notify pgrst, 'reload schema';
