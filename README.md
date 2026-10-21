# Bayanihan Market

A community marketplace for one municipality (**Donsol, Sorsogon**). Residents browse and wishlist
products from local sellers. Approved sellers manage their shop and listings from a seller dashboard.

- **Frontend:** React 19 + Vite, Tailwind CSS v4, React Router DOM, Lucide icons (Neumorphism design in
  Nordic Indigo `#3F4685` and Vanilla Mist `#F7F3E8`)
- **Backend:** Supabase Auth, Postgres with Row Level Security, Storage (`product-images` bucket), Realtime

> **Setup status:** this repository contains everything needed, but nothing has been applied to a Supabase
> project yet. Follow the steps below to create the database and connect the app.

---

## 1. Create a Supabase project

1. Sign in at <https://supabase.com/dashboard> and click **New project**.
2. Choose a name (e.g. `bayanihan-market`), a strong database password (store it in a password manager;
   the app never needs it), and a region close to your users (e.g. Singapore).
3. Wait for the project to finish provisioning.

## 2. Run the database migration

1. In your project, open **SQL Editor → New query**.
2. Open [`supabase/migrations/20261013000000_bayanihan_market.sql`](supabase/migrations/20261013000000_bayanihan_market.sql),
   copy **the whole file**, paste it into the editor, and click **Run**.
3. You should see "Success. No rows returned". The script is safe to run again if something fails halfway.
   If you ran an earlier version that was set to Taal, also run
   [`supabase/migrations/20261013010000_switch_to_donsol.sql`](supabase/migrations/20261013010000_switch_to_donsol.sql).
4. Check that it worked:
   - **Table Editor** shows `app_config`, `profiles`, `shops`, `products`, `wishlists`, each marked "RLS enabled".
   - **Storage** shows a public bucket named `product-images`.
   - **Authentication → Policies** lists the policies for each table and for `storage.objects`.

The migration creates:

| Part | What it does |
| ---- | ------------ |
| Types | `app_role` (buyer, seller), `seller_status` (none, pending, approved, rejected), `product_category` |
| `app_config` | The marketplace municipality (`Donsol`), province (`Sorsogon`), and an `auto_approve_sellers` switch |
| `profiles` | One row per user, linked to `auth.users`: name, role, seller status, municipality, barangay |
| `shops` | One per seller: name, description, category, municipality (always the configured one), barangay |
| `products` | Listings with price (₱, 2 decimals), category, stock, image, `is_active`; FK guarantees the shop belongs to the seller |
| `wishlists` | Per-user saved products, unique per user + product |
| Triggers | Create the profile and shop on sign-up, keep `updated_at` current, pin sellers and shops to the configured municipality, block role/status changes by users |
| Indexes | On foreign keys, category, `created_at`, and a trigram index for product-name search |
| RLS + grants | See [Security model](#security-model) |
| Storage | `product-images` bucket (public read, 5 MB limit, JPG/PNG/WebP only) and folder-per-seller policies |
| Realtime | Adds `products` to the `supabase_realtime` publication so open pages refresh on changes |

**Run the follow-up migrations too, in order** (each one in a new SQL Editor query):

| File | Purpose |
| ---- | ------- |
| `20261013010000_switch_to_donsol.sql` | Sets the municipality to Donsol, Sorsogon (needed only if you ran an older Taal version) |
| `20261015000000_sell_by_weight.sql` | Adds selling **per kilo** (`unit`, `weight_step`, decimal stock). **Required**: the app reads these columns |
| `20261018000000_orders.sql` | Cart checkout and orders: `orders`, `order_items`, and the `place_order()` / `update_order_status()` functions. **Required** for checkout |
| `20261019000000_delivery_map.sql` | Map pins: shop location, delivery pin on orders, service-area check; updates `place_order()`. **Required**: the app sends the delivery pin |

### Selling by the kilo

Sellers choose **Sold by → Per piece** or **Per kilo** for each product. For per-kilo items they enter the
**price per kilo**, the **kilos available** (decimals allowed, e.g. 12.5), and the **smallest weight buyers can
order** (¼, ½ or 1 kg). Choosing *Fresh Produce* or *Meat & Seafood* pre-selects per kilo. Buyers then pick a weight
(quick buttons like ¼, ½, ¾, 1, 1½ kg, or − / +) on the product page and see the total (price × kilos) instantly,
limited to what's in stock. The database enforces the allowed units and steps and keeps per-piece stock a whole number.

### Cart and orders

- **Buyers** add a chosen weight or quantity to the **Cart** (`/cart`). The cart is saved in the browser per account; a guest cart moves to the account on sign-in. At checkout they pick **Pickup** or **Delivery within the municipality**, enter a mobile number (and barangay + address for delivery) and an optional note. Payment is **cash on pickup/delivery**.
- A cart with items from several shops becomes **one order per shop**. Buyers follow them in **My Orders** (`/orders`) and can cancel while the order is still *Waiting for seller*.
- **Sellers** handle orders in **Seller Dashboard → Orders** (`/seller/orders`): *Confirm* → *Ready for pickup / Out for delivery* → *Completed*, or *Cancel* (with an optional reason). The dashboard shows how many new orders are waiting. Lists update live.
- **Enforced by the database:** the browser only sends product ids and quantities. `place_order()` reads prices from the database, checks stock, weight steps, active listings and seller approval, blocks buying your own product, deducts stock, and creates the orders in one transaction. Orders can't be inserted or edited directly; `update_order_status()` allows only valid steps and returns stock on cancellation. Buyers see only their orders; sellers see only their shop's orders (with the buyer's name, phone and address for fulfilment).

### Delivery map and distance

- **Sellers** pin their shop on the map in **Shop Profile** (tap the map, drag the pin, or "Use my current location" while at the shop). The dashboard reminds them until it's set.
- **Buyers** choosing **Delivery** must pin where the order should go. After checkout, the order page (`/orders/:id`) shows a map with the **shop pin**, the **delivery pin**, the **route**, the **road distance and travel time**, the **straight-line distance**, and a **Google Maps** directions button. Sellers see the same map from their Orders page.
- Pins must be inside the service area (within `service_radius_km`, default 15 km, of the municipality centre in `app_config`); the database rejects pins outside it. The delivery pin is visible only to that buyer and that seller; shop pins are public like the shop.
- Maps use **OpenStreetMap** tiles via **Leaflet** (no API key). Road distance comes from the public **OSRM demo server** (OpenStreetMap routing). It is best-effort; if it's unavailable the page shows the straight-line distance. For heavy production use, host your own tiles/routing or use a commercial provider, per the OpenStreetMap and OSRM usage policies.

Using the Supabase CLI instead? Run `supabase link --project-ref <your-ref>` then `supabase db push`.

## 3. Configure Authentication

In **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:5173` for development (change it to your real domain when you deploy).
- **Redirect URLs:** add `http://localhost:5173/**` (and later `https://your-domain/**`). Email confirmation
  links go to `/signin` and password-reset links to `/reset-password`.

In **Authentication → Sign In / Providers → Email** (names vary slightly by dashboard version):

- Keep **Email** enabled and **Confirm email** on (recommended). New users must click the link in their inbox
  before signing in, and the app tells them so.
- Set the **minimum password length** to at least **8** to match the app's own validation.
- Supabase's built-in email service is heavily rate-limited and meant for testing. For real users, configure
  **custom SMTP** under **Authentication → Emails**.

## 4. Add the environment variables

1. Copy `.env.example` to `.env.local` (git-ignored).
2. In **Project Settings → API** (or **API Keys**), copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - the **publishable** key (`sb_publishable_…`) or the legacy **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
VITE_USE_MOCK_DATA=false
```

> ⚠️ **Never use the `service_role` / secret key (`sb_secret_…`) in this app.** Every `VITE_` variable is
> bundled into public JavaScript, and that key bypasses all security. The app detects it and refuses to start.
> If it was ever exposed, rotate it in the dashboard.

## 5. Run the app

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. If the variables are missing or invalid, the app shows a setup screen
instead of failing silently.

## 6. Approve sellers

Anyone can register as a seller, but a new seller is **pending**. Their shop is saved, yet the database
refuses product listings and image uploads until an administrator approves them. To approve, run in the **SQL Editor**:

```sql
update public.profiles
set seller_status = 'approved'
where id = (select id from auth.users where email = 'seller@example.com');
```

Use `'rejected'` to decline, or `'pending'` to suspend (their products disappear from the marketplace).
To list waiting sellers:

```sql
select p.full_name, u.email, s.shop_name, s.barangay, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
left join public.shops s on s.owner_id = p.id
where p.role = 'seller' and p.seller_status = 'pending'
order by p.created_at;
```

**For local testing only** you can auto-approve new sellers:

```sql
update public.app_config set value = 'true' where key = 'auto_approve_sellers';
```

Set it back to `'false'` before real users sign up.

## 7. (Optional) Add sample products

After registering **and approving** a seller, open [`supabase/seed.sql`](supabase/seed.sql), replace the email
on the `seller_email` line with that seller's email, and run it in the SQL Editor. It adds 8 Donsol-themed sample
listings to that seller's shop.

---

## Testing checklist

1. **Register a buyer.** Confirm the email, sign in, and you land on **Marketplace**.
2. **Register a seller.** After confirming and signing in you land on **Seller Dashboard**, with a banner saying
   the account is awaiting approval. **Add Product** is locked.
3. **Approve the seller** (step 6) and refresh. The banner disappears and you can add products.
4. **Add a product with a photo.** JPG, PNG or WebP up to 5 MB work; bigger or other files are rejected
   before upload. Check that the photo appears on the card and the details page, and in **Storage →
   product-images → <seller id>/**.
5. **Edit / hide / delete.** Change the price, untick *Visible to buyers* (it disappears for buyers but stays in
   *My Products* with a "Hidden" badge), then delete it with the confirmation dialog. The photo file is removed too.
6. **Live updates.** With the marketplace open in a second window, add or edit a product. The list refreshes
   within a second.
7. **Wishlist.** As the buyer, tap the heart on a few products, reload, and sign in on another browser. The
   wishlist follows the account. Guests are asked to sign in first.
8. **Restrictions.** As the buyer, open `/seller/dashboard` and see "Seller accounts only". As a second seller,
   open `/seller/products/edit/<first seller's product id>` and see "You can't edit this listing".
9. **Password reset.** Use *Forgot password?*, open the email link in the same browser, and set a new password.
10. **Remember me.** Sign in with it unticked, close the tab, and reopen. You're signed out.

---

## Security model

**Row Level Security is on for every table.** The browser only ever holds the publishable key, so the
policies below are what actually protect the data.

| Data | Who can read | Who can write |
| ---- | ------------ | ------------- |
| `profiles` | Your own row. **Approved sellers'** name, municipality and barangay are public (shown on listings). Buyer profiles are private. | You can update only `full_name`, `municipality`, `barangay` of your own row. Rows are created only by the sign-up trigger. |
| `shops` | Everyone, for approved sellers; owners always see their own | Sellers create/update **only their own** shop (`shop_name`, `description`, `category`, `barangay`). Municipality is forced to the configured one. |
| `products` | Everyone: **active** products of **approved** sellers. Sellers also see their own hidden ones. | Only **approved** sellers in the configured municipality can insert/update, and only rows where `seller_id = auth.uid()`. Owners can delete their own. Owner, shop and timestamps can't be changed. |
| `wishlists` | Only the owner | Only the owner, and only for products they're allowed to see |
| `auth.users` (emails) | Never exposed to the API | Managed by Supabase Auth |
| Storage `product-images` | Public URLs (needed to show photos) | Approved sellers upload only inside `product-images/<their user id>/`; owners update/delete only their own folder |

**How privilege escalation is blocked:**

- `role` and `seller_status` aren't in the column-level `UPDATE` grant, so users simply can't write them. A
  trigger also rejects any change coming from an app user, as a second line of defence.
- The `role` chosen at sign-up comes from user-controlled metadata, so it only ever creates a **pending**
  seller. Listing products requires `seller_status = 'approved'`, which only an admin can set.
- The service-role key is never used in the frontend. Admin actions are done in the dashboard SQL Editor.

### What the database enforces vs. what needs extra verification

| Rule | Enforced by |
| ---- | ----------- |
| Only approved sellers can list products or upload images | Database (RLS + `is_approved_seller()`) |
| Sellers can't modify other sellers' shops, products or images | Database (RLS, composite foreign key, storage folder policies) |
| Users can't make themselves sellers or approve themselves | Database (column grants + trigger) |
| Shops and sellers are always in the configured municipality | Database (triggers set it; users can't write it) |
| Products, prices, stock, names and descriptions are valid | Database (CHECK constraints), mirrored by frontend validation |
| Image type and size | Storage bucket limits (5 MB; JPG/PNG/WebP), mirrored by frontend checks |
| **The seller really lives or operates in that municipality and barangay** | **Not automatable in the database.** The admin must verify it (e.g. business permit, barangay clearance, valid ID) before approving. Any typed address can be faked, so approval is the real gate. |
| Fraud, spam and abusive content | Needs moderation tooling or server-side checks (e.g. an Edge Function) in a future version |
| Rate limiting of sign-ups and logins | Supabase Auth's built-in limits; add CAPTCHA (Auth → Attack Protection) for production |

Frontend checks (route guards, filters, disabled buttons) are there for usability only. The database rejects
the same actions even if someone bypasses the UI.

---

## Configuration

**Changing the municipality.** It's set in two places that must match:

1. [`src/lib/config.js`](src/lib/config.js): `MUNICIPALITY.name`, `province`, and the barangay list used in forms
   (currently Donsol's 51 barangays).
2. The database:
   ```sql
   update public.app_config set value = 'YourTown' where key = 'municipality';
   update public.app_config set value = 'YourProvince' where key = 'province';
   ```

Existing approved sellers outside the new municipality stop being able to list until their profile and shop are
updated by an admin.

**Product categories** are a Postgres enum (`product_category`) and the `CATEGORIES` array in `src/lib/config.js`.
To add one, run `alter type public.product_category add value 'New Category';` and add it to the array.

## Mock data mode (development only)

To work on the UI without Supabase, set `VITE_USE_MOCK_DATA=true` in `.env.local` and run `npm run dev`.
The app then uses sample Donsol products and two demo accounts (`seller@demo.ph` / `buyer@demo.ph`, password
`Demo1234`), stored in this browser's localStorage. This mode is **not secure**, isn't shared between devices,
and is **ignored in production builds** (`npm run build`).

## Routes

| Route | Access | Description |
| ----- | ------ | ----------- |
| `/` | Everyone | Landing page |
| `/signin`, `/register` | Guests | Supabase email/password sign-in and sign-up (buyer or seller) |
| `/forgot-password`, `/reset-password` | Everyone | Password reset by email |
| `/marketplace` | Everyone | Search by name, filter by category, municipality, barangay, availability; sort |
| `/products/:id` | Everyone | Product details, seller and shop info, wishlist button |
| `/wishlist` | Signed in | Saved products |
| `/account` | Signed in | Edit your name, municipality and barangay |
| `/seller/dashboard` | Sellers | Approval status, stats, recent and low-stock items |
| `/seller/products` | Sellers | Search, view, edit, hide and delete your listings |
| `/seller/products/add`, `/seller/products/edit/:id` | Approved sellers | Product form with photo upload |
| `/seller/profile` | Sellers | Shop name, category, barangay, description |

## Project structure

```
supabase/
  migrations/…_bayanihan_market.sql   Schema, RLS, grants, triggers, storage bucket and policies
  seed.sql                            Optional sample products for one approved seller
src/
  lib/supabase.js        Supabase client (env vars, secret-key guard, "Remember me" session storage)
  lib/config.js          Municipality, barangays and categories (central configuration)
  services/              Data access, picked once at startup in services/index.js
    supabase/            authService, productService, wishlistService, storageService
    mock/                localStorage implementations for VITE_USE_MOCK_DATA
    errors.js            Turns Supabase errors into friendly messages
  context/               AuthProvider (session, profile) and MarketProvider (products, wishlist, realtime)
  components/            UI building blocks, layouts and route guards (RequireAuth, RequireSeller)
  pages/                 Landing, auth pages, Marketplace, ProductDetails, Wishlist, Account, seller/*
```

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Setup screen: "Connect Bayanihan Market to Supabase" | `.env.local` is missing or the dev server wasn't restarted after editing it |
| "The database isn't set up yet" | Run the migration (step 2) |
| "Your account has no profile yet" | The user signed up before the migration ran. Delete the user under **Authentication → Users** and register again |
| Sign-up says to check email but nothing arrives | Check spam; the built-in mailer is rate-limited, so configure custom SMTP |
| Seller can't add products | They're still pending. Approve them (step 6) |
| Reset link says "invalid or has expired" | Open it in the same browser you requested it from, and check the Redirect URLs (step 3) |
| Products don't update live | Make sure `products` is in **Database → Publications → supabase_realtime** (the migration adds it) |
