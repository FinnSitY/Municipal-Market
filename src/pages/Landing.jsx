import { ArrowRight, HandCoins, HeartHandshake, Leaf, Sparkles } from 'lucide-react'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import Footer from '../components/Footer.jsx'
import MarketCollage from '../components/MarketCollage.jsx'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useFlash } from '../hooks/useFlash.js'

const benefits = [
  {
    icon: HandCoins,
    title: 'Keep money in the community',
    text: 'Every peso spent locally circulates back into your barangay, supporting families and creating jobs.',
  },
  {
    icon: Leaf,
    title: 'Fresher and greener',
    text: 'Products travel shorter distances, so you get fresher goods with a smaller environmental footprint.',
  },
  {
    icon: HeartHandshake,
    title: 'Know who makes it',
    text: 'Buy directly from the bakers, farmers and artisans you see every day, and build real relationships.',
  },
  {
    icon: Sparkles,
    title: 'Discover hidden gems',
    text: 'Find home-based shops and one-of-a-kind products you won’t see in big malls or online giants.',
  },
]

const accountLabels = { buyer: 'Buyer', seller: 'Seller' }

export default function Landing() {
  const { user } = useAuth()
  const [flash, dismissFlash] = useFlash()

  return (
    <div className="min-h-screen overflow-x-clip">
      <Navbar />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-14 lg:pb-28">
          <div>
            {flash && (
              <Alert type={flash.type} onDismiss={dismissFlash} className="mb-6">
                {flash.message}
              </Alert>
            )}
            {user && (
              <Alert type="info" className="mb-6">
                Signed in as <strong>{user.fullName}</strong> ({accountLabels[user.accountType]}
                {user.shop ? ` · ${user.shop.name}` : ''}).
              </Alert>
            )}

            <p className="inline-flex items-center gap-2 rounded-full bg-sage px-4 py-1.5 text-sm font-semibold text-sage-dark shadow-neu-sm">
              <span className="size-2 rounded-full bg-sage-dark" aria-hidden="true" />
              Your neighborhood marketplace
            </p>
            <h1 className="mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Discover and Support <span className="text-nordic">Local Businesses.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Bayanihan Market connects residents with the sellers in their own community, from sari-sari stores and
              home bakers to farmers and artisans. Browse local products, find shops near your barangay, and help your
              neighbors thrive.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              {user ? (
                <>
                  <Button to="/marketplace" size="lg">
                    Browse Marketplace
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </Button>
                  {user.accountType === 'seller' ? (
                    <Button to="/seller/dashboard" variant="secondary" size="lg">
                      Seller Dashboard
                    </Button>
                  ) : (
                    <Button to="/wishlist" variant="secondary" size="lg">
                      My Wishlist
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button to="/register" size="lg">
                    Get Started
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </Button>
                  <Button to="/signin" variant="secondary" size="lg">
                    Sign In
                  </Button>
                </>
              )}
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4">
              {[
                ['120+', 'Local sellers'],
                ['18', 'Barangays'],
                ['900+', 'Products'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl p-3 text-center shadow-neu-inset">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-xl font-extrabold text-nordic sm:text-2xl">{value}</dd>
                  <dd className="text-xs text-muted" aria-hidden="true">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <MarketCollage />
        </section>

        <section id="benefits" className="scroll-mt-8 bg-white/40 py-20" aria-labelledby="benefits-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold tracking-[0.2em] text-nordic uppercase">Why it matters</p>
              <h2 id="benefits-title" className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Small purchases, big impact on your community
              </h2>
            </div>

            <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-3xl bg-vanilla p-7 shadow-neu transition duration-300 hover:-translate-y-1">
                  <span className="grid size-14 place-items-center rounded-2xl bg-vanilla text-nordic shadow-neu-inset">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {!user && (
          <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-8 rounded-[2rem] bg-nordic p-8 text-white shadow-neu-lg sm:p-12 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-extrabold sm:text-3xl">Have something to sell?</h2>
                <p className="mt-2 max-w-lg text-white/85">
                  Open your shop on Bayanihan Market and reach residents across your municipality. It’s free to start.
                </p>
              </div>
              <Button
                to="/register?type=seller"
                variant="secondary"
                size="lg"
                className="shadow-[0_10px_24px_rgba(20,22,50,0.35)]! focus-visible:ring-white focus-visible:ring-offset-nordic"
              >
                Become a Seller
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
