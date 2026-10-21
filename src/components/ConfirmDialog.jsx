import { TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import Button from './Button.jsx'

/** Modal confirmation built on <dialog>, which handles focus trapping and the Escape key. */
export default function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', busy = false, onConfirm, onCancel }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[2rem] bg-vanilla p-0 text-ink shadow-neu-lg backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#fbe4e0] text-danger">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </span>
        <h2 id="confirm-title" className="mt-5 text-xl font-bold">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy} className="bg-danger! hover:bg-[#912018]!">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
