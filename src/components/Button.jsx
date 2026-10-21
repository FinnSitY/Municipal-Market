import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold whitespace-nowrap transition duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-2 focus-visible:ring-offset-vanilla ' +
  'disabled:pointer-events-none disabled:opacity-60'

const variants = {
  primary: 'bg-nordic text-white shadow-neu hover:-translate-y-0.5 hover:bg-nordic-dark active:translate-y-0 active:shadow-neu-pressed',
  secondary: 'bg-vanilla text-nordic shadow-neu hover:-translate-y-0.5 hover:text-nordic-dark active:translate-y-0 active:shadow-neu-inset',
  ghost: 'text-nordic hover:bg-white/70 active:shadow-neu-inset',
}

const sizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-base sm:text-lg',
}

/** Renders a router <Link> when `to` is given, an <a> for `href`, otherwise a <button>. */
export default function Button({ to, href, variant = 'primary', size = 'md', className = '', children, ...props }) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
