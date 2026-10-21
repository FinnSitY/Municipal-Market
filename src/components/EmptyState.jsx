export default function EmptyState({ icon: Icon, title, children, action, className = '' }) {
  return (
    <div className={`rounded-[2rem] px-6 py-14 text-center shadow-neu-inset ${className}`}>
      {Icon && (
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-vanilla text-nordic shadow-neu">
          <Icon className="size-7" aria-hidden="true" />
        </span>
      )}
      <h2 className="mt-5 text-xl font-bold text-ink">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-muted">{children}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
