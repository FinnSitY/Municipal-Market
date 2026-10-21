import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Logo from '../components/Logo.jsx'

const sections = [
  ['Early version', 'Bayanihan Market is an early community project. Ordering and payments are not available yet; arrange purchases directly with sellers.'],
  ['Community conduct', 'Buyers and sellers agree to communicate respectfully, describe products honestly, and honor agreed prices and schedules.'],
  ['Seller accounts', 'Only sellers based in the participating municipality can list products, and each seller account is reviewed and approved by the marketplace administrator before listings go live.'],
  ['Seller responsibilities', 'Sellers are responsible for the quality, safety and legality of the products they list, including any permits required by their municipality.'],
  ['Your data', 'Your email and password are managed by our authentication provider. Buyer profiles are private. Approved sellers’ names, shop details, municipality and barangay are shown publicly so customers can find them.'],
]

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <article className="rounded-[2rem] bg-vanilla p-6 shadow-neu-lg sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Terms and Conditions</h1>
          <p className="mt-2 text-sm text-muted">Demo version · Last updated October 2026</p>
          <div className="mt-8 space-y-6">
            {sections.map(([title, text]) => (
              <section key={title}>
                <h2 className="text-lg font-bold text-nordic">{title}</h2>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </section>
            ))}
          </div>
          <Button variant="secondary" className="mt-10" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-5" aria-hidden="true" />
            Go back
          </Button>
        </article>
      </main>
    </div>
  )
}
