import { KeyRound, ShieldAlert, Store } from 'lucide-react'

const messages = {
  missing: {
    icon: KeyRound,
    title: 'Connect Bayanihan Market to Supabase',
    body: 'The Supabase URL or publishable key is missing.',
  },
  'bad-url': {
    icon: KeyRound,
    title: 'Check your Supabase URL',
    body: 'VITE_SUPABASE_URL isn’t a valid URL. It should look like https://your-project.supabase.co.',
  },
  'secret-key': {
    icon: ShieldAlert,
    title: 'A secret key was found. The app won’t start.',
    body: 'The key in your environment is a service_role / secret key. It bypasses all security rules and must never be used in the browser. Replace it with the publishable (or anon) key, and rotate the secret key in Supabase if it was shared.',
  },
}

/** Shown instead of the app when Supabase isn't configured. Uses no router or backend. */
export default function SetupRequired({ reason }) {
  const { icon: Icon, title, body } = messages[reason] ?? messages.missing

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] bg-vanilla p-6 shadow-neu-lg sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-nordic text-vanilla shadow-neu">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold text-nordic">Bayanihan Market</span>
        </div>

        <h1 className="mt-8 flex items-start gap-3 text-2xl font-extrabold tracking-tight text-ink">
          <Icon className={`mt-1 size-6 shrink-0 ${reason === 'secret-key' ? 'text-danger' : 'text-nordic'}`} aria-hidden="true" />
          {title}
        </h1>
        <p className="mt-3 text-muted">{body}</p>

        <ol className="mt-8 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink marker:font-bold marker:text-nordic">
          <li>
            Copy <code className="rounded bg-white px-1.5 py-0.5">.env.example</code> to{' '}
            <code className="rounded bg-white px-1.5 py-0.5">.env.local</code> in the project folder.
          </li>
          <li>
            In the Supabase Dashboard open <strong>Project Settings → API</strong> and copy the <strong>Project URL</strong> and
            the <strong>publishable</strong> (or <strong>anon public</strong>) key into it.
          </li>
          <li>
            Run <code className="rounded bg-white px-1.5 py-0.5">supabase/migrations/…_bayanihan_market.sql</code> in the
            Supabase SQL Editor (see README).
          </li>
          <li>
            Restart <code className="rounded bg-white px-1.5 py-0.5">npm run dev</code>.
          </li>
        </ol>

        <p className="mt-8 rounded-2xl p-4 text-xs leading-relaxed text-muted shadow-neu-inset">
          Just want to look around? In development you can set{' '}
          <code className="font-semibold text-ink">VITE_USE_MOCK_DATA=true</code> in .env.local to use offline sample data
          stored in this browser.
        </p>
      </div>
    </main>
  )
}
