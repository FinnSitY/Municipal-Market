import { Carrot, Coffee, Croissant, Fish, MapPin, ShoppingBag, Star } from 'lucide-react'

const products = [
  { icon: Carrot, name: 'Garden Vegetables', seller: 'Aling Nena’s Garden', price: '₱85 / bundle', tint: 'bg-sage', span: 'col-span-2 sm:col-span-1 sm:row-span-2', big: true },
  { icon: Croissant, name: 'Fresh Pandesal', seller: 'Panaderia Rosario', price: '₱5 / pc', tint: 'bg-[#f3e2c4]' },
  { icon: Coffee, name: 'Brewed Coffee', seller: 'Butanding Café', price: '₱150 / 2 cups', tint: 'bg-[#e6ddd2]' },
  { icon: ShoppingBag, name: 'Abaca Tote', seller: 'Abaca Weaves', price: '₱520', tint: 'bg-[#dfe1f0]' },
  { icon: Fish, name: 'Daily Catch', seller: 'Tindahan sa Pantalan', price: '₱240 / kg', tint: 'bg-[#d6e6ea]' },
]

function ProductTile({ icon: Icon, name, seller, price, tint, span = '', big }) {
  return (
    <div className={`flex flex-col justify-between rounded-3xl bg-vanilla p-4 shadow-neu ${span}`}>
      <div className={`grid place-items-center rounded-2xl ${tint} ${big ? 'h-28 sm:h-full sm:min-h-40' : 'h-20'}`}>
        <Icon className={`${big ? 'size-14' : 'size-9'} text-nordic`} strokeWidth={1.5} />
      </div>
      <div className="mt-3">
        <p className="text-sm font-bold text-ink">{name}</p>
        <p className="truncate text-xs text-muted">{seller}</p>
        <p className="mt-1 text-sm font-bold text-nordic">{price}</p>
      </div>
    </div>
  )
}

/** Decorative product collage for the hero; exposed to screen readers as a single image. */
export default function MarketCollage() {
  return (
    <div
      role="img"
      aria-label="A collage of local products: garden vegetables, pandesal, brewed coffee, a handwoven abaca tote and fresh fish from nearby sellers."
      className="relative mx-auto w-full max-w-lg"
    >
      <div className="rounded-[2.5rem] bg-vanilla p-4 shadow-neu-lg sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
          {products.map((p) => (
            <ProductTile key={p.name} {...p} />
          ))}
        </div>
      </div>

      <div className="absolute -top-4 -left-2 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-ink shadow-neu sm:-left-6">
        <MapPin className="size-4 text-nordic" />
        120+ sellers near you
      </div>
      <div className="absolute -right-2 -bottom-4 flex items-center gap-2 rounded-2xl bg-nordic px-3 py-2 text-xs font-semibold text-white shadow-neu sm:-right-6">
        <Star className="size-4 fill-[#f5c25b] text-[#f5c25b]" />
        4.9 community rating
      </div>
    </div>
  )
}
