import Button from '../components/Button.jsx'
import Logo from '../components/Logo.jsx'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-vanilla p-10 text-center shadow-neu-lg">
        <Logo />
        <p className="mt-8 text-6xl font-extrabold text-nordic">404</p>
        <h1 className="mt-2 text-xl font-bold">We couldn’t find that page</h1>
        <p className="mt-2 text-muted">The link may be broken or the page may have moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/marketplace">Go to Marketplace</Button>
          <Button to="/" variant="secondary">
            Back to home
          </Button>
        </div>
      </div>
    </main>
  )
}
