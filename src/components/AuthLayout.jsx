import { ArrowLeft, HeartHandshake, MapPin, ShieldCheck } from 'lucide-react'
import DemoNotice from './DemoNotice.jsx'
import Logo from './Logo.jsx'
import TextLink from './TextLink.jsx'

const highlights = [
  { icon: MapPin, text: 'Find sellers in your barangay and nearby municipalities.' },
  { icon: HeartHandshake, text: 'Every purchase helps a neighbor’s small business grow.' },
  { icon: ShieldCheck, text: 'Verified local shops with honest product details.' },
]

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Logo />
        <TextLink to="/" className="inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </TextLink>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-10 px-4 pt-4 pb-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:pt-8">
        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-nordic p-10 text-white shadow-neu-lg lg:sticky lg:top-8 lg:block">
          <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/5" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-10 size-64 rounded-full bg-sage/10" aria-hidden="true" />
          <p className="relative text-sm font-semibold tracking-[0.2em] text-sage uppercase">Sama-sama, para sa lokal</p>
          <h2 className="relative mt-4 text-3xl leading-tight font-extrabold">
            Your community’s marketplace, right around the corner.
          </h2>
          <ul className="relative mt-8 space-y-5">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sage">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="pt-2 text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-[2rem] bg-vanilla p-6 shadow-neu-lg sm:p-10" aria-labelledby="auth-title">
          <h1 id="auth-title" className="text-3xl font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          <DemoNotice className="mt-8" />
        </section>
      </main>
    </div>
  )
}
