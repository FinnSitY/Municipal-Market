import { Beef, Coffee, Croissant, Gem, HandHelping, Home, Package, Scissors, Shirt, Sprout } from 'lucide-react'

// Icon and tint used for product image placeholders, per category.
const styles = {
  'Fresh Produce': { icon: Sprout, tint: 'bg-sage' },
  'Meat & Seafood': { icon: Beef, tint: 'bg-[#f1ddd6]' },
  'Baked Goods & Snacks': { icon: Croissant, tint: 'bg-[#f3e2c4]' },
  Beverages: { icon: Coffee, tint: 'bg-[#e6ddd2]' },
  Handicrafts: { icon: Scissors, tint: 'bg-[#dfe1f0]' },
  'Clothing & Accessories': { icon: Shirt, tint: 'bg-[#e4dcef]' },
  'Home & Living': { icon: Home, tint: 'bg-[#d6e6ea]' },
  'Health & Beauty': { icon: Gem, tint: 'bg-[#f2dbe3]' },
  Services: { icon: HandHelping, tint: 'bg-[#e1ead9]' },
}

export function categoryStyle(category) {
  return styles[category] ?? { icon: Package, tint: 'bg-[#ebe5d6]' }
}
