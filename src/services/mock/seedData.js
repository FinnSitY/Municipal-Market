/*
 * Mock data for the demo. Shops, people and prices are fictional but modeled on
 * products you'd find in Donsol, Sorsogon. Nothing here comes from a real database.
 */

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`

// Password for both demo accounts is "Demo1234" (stored as its SHA-256 hash).
const DEMO_PASSWORD_HASH = 'b22f213ec710f0b0e86297d10279d69171f50f01a04edf40f472a563e7ad8576'

export const DEMO_ACCOUNTS = [
  {
    id: 'demo-seller-elena',
    accountType: 'seller',
    fullName: 'Elena Gallanosa',
    email: 'seller@demo.ph',
    passwordHash: DEMO_PASSWORD_HASH,
    shop: {
      name: 'Aling Elena’s Donsol Delicacies',
      municipality: 'Donsol',
      barangay: 'Central Barangay 2 (Poblacion)',
      category: 'Baked Goods & Snacks',
      about: 'Pili treats and Bicolano favorites made in small batches since 1998.',
      latitude: 12.91,
      longitude: 123.599,
    },
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'demo-buyer-juan',
    accountType: 'buyer',
    fullName: 'Juan Dela Cruz',
    email: 'buyer@demo.ph',
    passwordHash: DEMO_PASSWORD_HASH,
    shop: null,
    createdAt: '2026-01-05T08:00:00.000Z',
  },
]

export const DEMO_PASSWORD = 'Demo1234'

const sellers = {
  elena: { sellerId: 'demo-seller-elena', shopName: 'Aling Elena’s Donsol Delicacies', sellerName: 'Elena Gallanosa', municipality: 'Donsol', shopLat: 12.91, shopLng: 123.599 },
  ramon: { sellerId: 'seed-ramon', shopName: 'Butanding Café', sellerName: 'Ramon Dioneda', municipality: 'Donsol', shopLat: 12.912, shopLng: 123.596 },
  liza: { sellerId: 'seed-liza', shopName: 'Tagbac Fresh Harvest', sellerName: 'Liza Escanilla', municipality: 'Donsol', shopLat: 12.9135, shopLng: 123.608 },
  jose: { sellerId: 'seed-jose', shopName: 'Panaderia de Donsol', sellerName: 'Jose Gerona', municipality: 'Donsol', shopLat: 12.9095, shopLng: 123.6005 },
  teresa: { sellerId: 'seed-teresa', shopName: 'Dancalan Fish Landing', sellerName: 'Teresa Lasala', municipality: 'Donsol', shopLat: 12.9105, shopLng: 123.5945 },
  carmen: { sellerId: 'seed-carmen', shopName: 'Abaca Weaves ng Donsol', sellerName: 'Carmen Dichoso', municipality: 'Donsol', shopLat: 12.9138, shopLng: 123.6086 },
  pilar: { sellerId: 'seed-arnel', shopName: 'Pilar Bay Catch', sellerName: 'Arnel Bautista', municipality: 'Pilar', shopLat: 12.9240, shopLng: 123.6740 },
}

const raw = [
  [sellers.elena, 'Honey-Glazed Pili Nuts (250 g)', 'Baked Goods & Snacks', 280, 24, 'Central Barangay 2 (Poblacion)', '',
    'Crunchy Sorsogon pili nuts roasted and glazed with wild honey. A favorite pasalubong for visitors to Donsol.'],
  [sellers.elena, 'Pili Tarts (box of 12)', 'Baked Goods & Snacks', 220, 4, 'Central Barangay 2 (Poblacion)', '',
    'Buttery mini tarts filled with sweet pili nut caramel. Baked fresh every Friday and Saturday.'],
  [sellers.elena, 'Frozen Pinangat (5 pieces)', 'Others', 175, 0, 'Central Barangay 2 (Poblacion)', '',
    'Taro leaves wrapped around shrimp and pork, slow-cooked in coconut milk with Bicol chili. Heat and serve.'],
  [sellers.ramon, 'Brewed Coffee (2 cups)', 'Beverages', 150, 12, 'Dancalan', unsplash('1509042239860-f550ce710b93'),
    'Two freshly brewed cups served black or with fresh milk, steps away from the whale shark interaction center.'],
  [sellers.ramon, 'Roasted Coffee Beans (250 g)', 'Beverages', 320, 40, 'Dancalan', unsplash('1447933601403-0c6688de566e'),
    'Bold, full-bodied beans from Bicol farms, medium-dark roasted in small batches. Ask us to grind them on pickup.'],
  [sellers.liza, 'Gulay Vegetable Bundle', 'Fresh Produce', 95, 30, 'Tagbac', unsplash('1597362925123-77861d3fbac7'),
    'Ampalaya, talong, okra, kalabasa, sitaw and tomatoes harvested the same morning. Enough for a family meal.'],
  [sellers.liza, 'Sweet Mangoes', 'Fresh Produce', 140, 1.75, 'Tagbac', unsplash('1601493700631-2b16ec4b4716'),
    'Ripe, fragrant mangoes picked at peak sweetness. Great for shakes, desserts or eating straight from the skin.', { unit: 'kg', weightStep: 0.25 }],
  [sellers.liza, 'Lakatan Bananas', 'Fresh Produce', 85, 50, 'Tagbac', unsplash('1571771894821-ce9b6c11b08e'),
    'Bright yellow lakatan bananas with creamy, sweet flesh. Grown without chemical ripening.', { unit: 'kg', weightStep: 0.5 }],
  [sellers.liza, 'Seasonal Fruit Basket', 'Fresh Produce', 650, 6, 'Tagbac', unsplash('1488459716781-31db52582fe9'),
    'A gift basket of the week’s best fruits from Donsol growers. Contents vary by season; message us for this week’s mix.'],
  [sellers.jose, 'Butter Croissants (box of 4)', 'Baked Goods & Snacks', 180, 15, 'Market Site Barangay 3 (Poblacion)', unsplash('1555507036-ab1f4038808a'),
    'Flaky, buttery croissants baked before sunrise. Best enjoyed the same day, or warmed briefly in the oven.'],
  [sellers.jose, 'Whole Wheat Country Bread', 'Baked Goods & Snacks', 145, 10, 'Market Site Barangay 3 (Poblacion)', unsplash('1509440159596-0249088772ff'),
    'Rustic, seeded whole wheat loaf with a crisp crust and soft crumb. Baked fresh every Tuesday, Thursday and Saturday.'],
  [sellers.jose, 'Local Rice', 'Others', 55, 120, 'Market Site Barangay 3 (Poblacion)', unsplash('1586201375761-83865001e31c'),
    'Well-milled rice from Sorsogon farms, sold by the kilo by our panaderia as a staple for regulars.', { unit: 'kg', weightStep: 1 }],
  [sellers.teresa, 'Smoked Longganisa', 'Meat & Seafood', 360, 24, 'Dancalan', unsplash('1607623814075-e51df1bdc82f'),
    'Garlicky Bicol-style pork longganisa, hand-tied and lightly smoked. Best fried until the edges caramelize.', { unit: 'kg', weightStep: 0.25 }],
  [sellers.teresa, 'Dried Danggit', 'Meat & Seafood', 820, 6.5, 'Dancalan', '',
    'Sun-dried rabbitfish split and salted by Dancalan fisherfolk. Fry until crisp and serve with garlic rice and vinegar.', { unit: 'kg', weightStep: 0.25 }],
  [sellers.carmen, 'Handwoven Abaca Tote', 'Handicrafts', 520, 18, 'Pangpang', '',
    'Sturdy tote woven from Bicol abaca fiber with reinforced handles. Perfect for palengke runs or the beach.'],
  [sellers.carmen, 'Butanding Print Shirt', 'Clothing & Accessories', 350, 2, 'Pangpang', '',
    'Soft cotton tee with a hand-drawn whale shark print, made in Donsol. Available in S to XL; message us for sizes.'],
  [sellers.pilar, 'Fresh Squid', 'Meat & Seafood', 280, 8, 'Poblacion', '',
    'Squid caught early morning off Pilar and cleaned on request. Sold by a neighboring seller in Pilar, Sorsogon.', { unit: 'kg', weightStep: 0.5 }],
]

// Rows without a unit are sold per piece.
export const SEED_PRODUCTS = raw.map(([seller, name, category, price, stock, barangay, imageUrl, description, unit], index) => ({
  id: `seed-${index + 1}`,
  name,
  description,
  price,
  category,
  stock,
  imageUrl,
  barangay,
  unit: 'piece',
  weightStep: 1,
  ...unit,
  ...seller,
  createdAt: new Date(Date.UTC(2026, 8, 30 - index)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 8, 30 - index)).toISOString(),
}))
