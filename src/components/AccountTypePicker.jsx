import { ShoppingBasket, Store } from 'lucide-react'

const types = [
  { value: 'buyer', label: 'Buyer', description: 'Shop from local sellers', icon: ShoppingBasket },
  { value: 'seller', label: 'Seller', description: 'Sell to your community', icon: Store },
]

export default function AccountTypePicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">I want to join as a…</legend>
      <div className="grid grid-cols-2 gap-4">
        {types.map(({ value: type, label, description, icon: Icon }) => {
          const selected = value === type
          return (
            <label
              key={type}
              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl p-4 text-center transition duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-nordic has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-vanilla sm:p-5 ${
                selected ? 'bg-vanilla text-nordic shadow-neu-inset ring-2 ring-nordic/70' : 'bg-vanilla text-ink shadow-neu hover:-translate-y-0.5'
              }`}
            >
              <input
                type="radio"
                name="accountType"
                value={type}
                checked={selected}
                onChange={() => onChange(type)}
                className="sr-only"
              />
              <span
                className={`grid size-12 place-items-center rounded-xl transition ${selected ? 'bg-nordic text-white' : 'bg-sage text-nordic'}`}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span className="font-bold">{label}</span>
              <span className="text-xs text-muted">{description}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
