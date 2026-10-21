-- =============================================================================
-- Bayanihan Market: OPTIONAL sample products (Donsol, Sorsogon)
--
-- Run this in the SQL Editor only AFTER:
--   1. running ALL migrations in supabase/migrations/ (including sell_by_weight),
--   2. registering a seller account in the app, and
--   3. approving that seller (see README → "Approve sellers").
-- Replace the email below with that seller's email address.
-- The products are fictional sample listings, attached to that seller's shop.
-- =============================================================================

do $$
declare
  seller_email text := 'replace-with-your-seller@example.com';
  v_seller uuid;
  v_shop uuid;
begin
  select id into v_seller from auth.users where email = lower(seller_email);
  if v_seller is null then
    raise exception 'No account found for %. Register a seller in the app first.', seller_email;
  end if;

  select id into v_shop from public.shops where owner_id = v_seller;
  if v_shop is null then
    raise exception 'The account % has no shop yet. Fill in Shop Profile in the seller dashboard first.', seller_email;
  end if;

  insert into public.products (seller_id, shop_id, name, description, price, category, stock_quantity, image_url, unit, weight_step)
  values
    (v_seller, v_shop, 'Honey-Glazed Pili Nuts (250 g)',
     'Crunchy Sorsogon pili nuts roasted and glazed with wild honey. A favorite pasalubong for visitors to Donsol.',
     280, 'Baked Goods & Snacks', 24, null, 'piece', 1),
    (v_seller, v_shop, 'Pili Tarts (box of 12)',
     'Buttery mini tarts filled with sweet pili nut caramel. Baked fresh every Friday and Saturday.',
     220, 'Baked Goods & Snacks', 4, null, 'piece', 1),
    (v_seller, v_shop, 'Dried Danggit',
     'Sun-dried rabbitfish split and salted by Dancalan fisherfolk. Fry until crisp and serve with garlic rice.',
     820, 'Meat & Seafood', 6.5, null, 'kg', 0.25),
    (v_seller, v_shop, 'Smoked Longganisa',
     'Garlicky Bicol-style pork longganisa, hand-tied and lightly smoked. Best fried until the edges caramelize.',
     360, 'Meat & Seafood', 24,
     'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=70', 'kg', 0.25),
    (v_seller, v_shop, 'Gulay Vegetable Bundle',
     'Ampalaya, talong, okra, kalabasa, sitaw and tomatoes harvested the same morning. Enough for a family meal.',
     95, 'Fresh Produce', 30,
     'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=70', 'piece', 1),
    (v_seller, v_shop, 'Sweet Mangoes',
     'Ripe, fragrant mangoes picked at peak sweetness. Great for shakes, desserts or eating straight from the skin.',
     140, 'Fresh Produce', 1.75,
     'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=70', 'kg', 0.25),
    (v_seller, v_shop, 'Brewed Coffee (2 cups)',
     'Two freshly brewed cups served black or with fresh milk, steps away from the whale shark interaction center.',
     150, 'Beverages', 12,
     'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=70', 'piece', 1),
    (v_seller, v_shop, 'Handwoven Abaca Tote',
     'Sturdy tote woven from Bicol abaca fiber with reinforced handles. Perfect for palengke runs or the beach.',
     520, 'Handicrafts', 18, null, 'piece', 1);
end $$;
