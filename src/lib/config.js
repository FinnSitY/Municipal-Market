// The municipality this marketplace serves. Keep `name` in sync with the
// `municipality` row in the database's public.app_config table (see README).
export const MUNICIPALITY = {
  name: 'Donsol',
  province: 'Sorsogon',
  // Map centre and service area; keep in sync with center_lat / center_lng /
  // service_radius_km in public.app_config.
  center: { lat: 12.9083, lng: 123.5981 },
  serviceRadiusKm: 15,
  // The 51 barangays of Donsol, Sorsogon.
  barangays: [
    'Alin',
    'Awaii (Poblacion)',
    'Banban',
    'Bandi',
    'Banuang Gurang',
    'Baras',
    'Bayawas',
    'Bororan Barangay 1 (Poblacion)',
    'Cabugao',
    'Central Barangay 2 (Poblacion)',
    'Cristo',
    'Dancalan',
    'De Vera',
    'Gimagaan',
    'Girawan',
    'Gogon',
    'Gura',
    'Juan Adre',
    'Lourdes',
    'Mabini',
    'Malapoc',
    'Malinao',
    'Market Site Barangay 3 (Poblacion)',
    'New Maguisa',
    'Ogod (Crossing)',
    'Old Maguisa',
    'Orange',
    'Pangpang',
    'Parina',
    'Pawala',
    'Pinamanaan',
    'Poso Pob. (Barangay 5)',
    'Punta Waling-Waling Dalisay (Poblacion)',
    'Rawis (Poblacion)',
    'San Antonio',
    'San Isidro',
    'San Jose',
    'San Rafael',
    'San Ramon',
    'San Vicente',
    'Santa Cruz (Itunggan)',
    'Sevilla',
    'Sibago',
    'Suguian',
    'Tagbac',
    'Tinanogan',
    'Tongdol',
    'Tres Marias (Poblacion)',
    'Tuba',
    'Tupas',
    'Vinisitahan',
  ],
}

export const MUNICIPALITY_LABEL = `${MUNICIPALITY.name}, ${MUNICIPALITY.province}`

export const CATEGORIES = [
  'Fresh Produce',
  'Meat & Seafood',
  'Baked Goods & Snacks',
  'Beverages',
  'Handicrafts',
  'Clothing & Accessories',
  'Home & Living',
  'Health & Beauty',
  'Services',
  'Others',
]

// Accepts "Donsol", "donsol, sorsogon", "Donsol Sorsogon", etc.
export function isConfiguredMunicipality(municipality = '') {
  const province = new RegExp(`\\b${MUNICIPALITY.province.toLowerCase()}\\b`)
  const town = municipality.toLowerCase().split(',')[0].replace(province, '').trim()
  return town === MUNICIPALITY.name.toLowerCase()
}

export const LOW_STOCK_THRESHOLD = 5
