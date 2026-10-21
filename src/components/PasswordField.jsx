import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import TextField from './TextField.jsx'

export default function PasswordField(props) {
  const [visible, setVisible] = useState(false)

  const toggle = (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      aria-controls={props.id}
      className="-mr-1 grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:text-nordic hover:shadow-neu-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic"
    >
      {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
    </button>
  )

  return <TextField icon={Lock} {...props} type={visible ? 'text' : 'password'} trailing={toggle} />
}
