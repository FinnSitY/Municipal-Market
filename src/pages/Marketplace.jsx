import { ArrowDownUp, MapPin, PackageSearch, Search, Store, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Checkbox from '../components/Checkbox.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadState from '../components/LoadState.jsx'
import ProductCard from '../components/ProductCard.jsx'
import SelectField from '../components/SelectField.jsx'
import TextField from '../components/TextField.jsx'
import { useMarket } from '../hooks/useMarket.js'
import { CATEGORIES, isConfiguredMunicipality, MUNICIPALITY, MUNICIPALITY_LABEL } from '../lib/config.js'

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name (A–Z)' },
]

const AREAS = [
  { value: 'local', label: `${MUNICIPALITY_LABEL} only` },
  { value: 'all', label: 'All municipalities' },
]

const DEFAULTS = { area: 'local', sort: 'newest' }

const sorters = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
}

const chipClasses = (active) =>
  `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic ${
    active ? 'bg-nordic text-white shadow-neu-pressed' : 'bg-vanilla text-muted shadow-neu-sm hover:text-nordic'
  }`

export default function Marketplace() {
  const { products: allProducts, status, error, reload } = useMarket()
  // Sellers also receive their own hidden listings; the public grid shows active ones only.
  const products = useMemo(() => allProducts.filter((p) => p.isActive !== false), [allProducts])
  const [params, setParams] = useSearchParams()

  // Filters live in the URL so they survive refreshes and the back button.
  // The search box keeps its own state: URL updates run in a transition, which would drop keystrokes.
  const [search, setSearch] = useState(() => params.get('q') ?? '')
  const filters = {
    q: search,
    category: params.get('category') ?? '',
    area: params.get('area') ?? DEFAULTS.area,
    barangay: params.get('barangay') ?? '',
    inStock: params.get('stock') === '1',
    sort: sorters[params.get('sort')] ? params.get('sort') : DEFAULTS.sort,
    seller: params.get('seller') ?? '',
  }

  function setFilter(key, value) {
    // Start from the live URL: `params` can lag behind while a previous update is still rendering.
    const next = new URLSearchParams(window.location.search)
    if (value && value !== DEFAULTS[key]) next.set(key, value)
    else next.delete(key)
    if (key === 'area' && value === 'all') next.delete('barangay')
    setParams(next, { replace: true })
  }

  function resetFilters() {
    setSearch('')
    setParams({}, { replace: true })
  }

  const results = useMemo(() => {
    const query = filters.q.trim().toLowerCase()
    return products
      .filter((p) => !query || p.name.toLowerCase().includes(query) || p.shopName.toLowerCase().includes(query))
      .filter((p) => !filters.category || p.category === filters.category)
      // Viewing one shop shows all of it, whatever the municipality filter says.
      .filter((p) => filters.seller || filters.area === 'all' || isConfiguredMunicipality(p.municipality))
      .filter((p) => !filters.barangay || p.barangay === filters.barangay)
      .filter((p) => !filters.inStock || p.stock > 0)
      .filter((p) => !filters.seller || p.sellerId === filters.seller)
      .sort(sorters[filters.sort])
  }, [products, filters.q, filters.category, filters.area, filters.barangay, filters.inStock, filters.seller, filters.sort])

  const localProducts = products.filter((p) => isConfiguredMunicipality(p.municipality))
  const shopCount = new Set(localProducts.map((p) => p.sellerId)).size
  const sellerShop = filters.seller && products.find((p) => p.sellerId === filters.seller)?.shopName
  const hasFilters = search !== '' || [...params.keys()].some((key) => key !== 'q')

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] bg-nordic px-6 py-10 text-white shadow-neu-lg sm:px-10">
        <div className="absolute -top-20 -right-10 size-64 rounded-full bg-white/5" aria-hidden="true" />
        <p className="relative flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-sage uppercase">
          <MapPin className="size-4" aria-hidden="true" />
          {MUNICIPALITY_LABEL}
        </p>
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Local Marketplace</h1>
        <p className="relative mt-2 max-w-xl text-white/85">
          {status === 'ready'
            ? `Browse ${localProducts.length} ${localProducts.length === 1 ? 'product' : 'products'} from ${shopCount} neighborhood ${shopCount === 1 ? 'shop' : 'shops'}, from pili treats to fresh catch and abaca crafts.`
            : 'Fresh produce, delicacies and crafts from sellers in your community.'}
        </p>
      </section>

      <section aria-label="Search and filters" className="mt-8 rounded-[2rem] bg-vanilla p-5 shadow-neu sm:p-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <TextField
            id="market-search"
            label="Search products"
            type="search"
            icon={Search}
            placeholder="e.g. pili, danggit, abaca"
            value={filters.q}
            onChange={(e) => {
              setSearch(e.target.value)
              setFilter('q', e.target.value)
            }}
            className="md:col-span-2"
          />
          <SelectField
            id="market-area"
            label="Municipality"
            icon={MapPin}
            options={AREAS}
            value={filters.area}
            onChange={(e) => setFilter('area', e.target.value)}
          />
          <SelectField
            id="market-sort"
            label="Sort by"
            icon={ArrowDownUp}
            options={SORTS}
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
          />
          {filters.area === 'local' && (
            <SelectField
              id="market-barangay"
              label="Barangay"
              options={MUNICIPALITY.barangays}
              placeholder="All barangays"
              placeholderSelectable
              value={filters.barangay}
              onChange={(e) => setFilter('barangay', e.target.value)}
            />
          )}
          <Checkbox
            id="market-stock"
            checked={filters.inStock}
            onChange={(e) => setFilter('stock', e.target.checked ? '1' : '')}
            className="self-end pb-3"
          >
            Show available items only
          </Checkbox>
        </div>

        <div role="group" aria-label="Category" className="-mx-1 mt-6 flex gap-3 overflow-x-auto px-1 pt-1 pb-2">
          <button type="button" aria-pressed={!filters.category} onClick={() => setFilter('category', '')} className={chipClasses(!filters.category)}>
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={filters.category === category}
              onClick={() => setFilter('category', filters.category === category ? '' : category)}
              className={chipClasses(filters.category === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {status === 'ready' && (
            <>
              Showing <strong className="text-ink">{results.length}</strong> {results.length === 1 ? 'product' : 'products'}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {sellerShop && (
            <span className="inline-flex items-center gap-2 rounded-full bg-sage py-1 pr-1 pl-3 text-sm font-semibold text-sage-dark">
              <Store className="size-4" aria-hidden="true" />
              {sellerShop}
              <button
                type="button"
                onClick={() => setFilter('seller', '')}
                aria-label={`Stop showing only ${sellerShop}`}
                className="grid size-6 place-items-center rounded-full hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-dark"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          )}
        </div>
      </div>

      {status !== 'ready' ? (
        <LoadState status={status} error={error} onRetry={reload} />
      ) : results.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <EmptyState icon={Store} title="No products listed yet" action={<Button to="/register?type=seller">Become a Seller</Button>}>
          Listings from approved sellers in {MUNICIPALITY_LABEL} will appear here.
        </EmptyState>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="No products match your search"
          action={<Button onClick={resetFilters}>Clear all filters</Button>}
        >
          Try a different keyword, pick another category, or include all municipalities.
        </EmptyState>
      )}
    </>
  )
}
