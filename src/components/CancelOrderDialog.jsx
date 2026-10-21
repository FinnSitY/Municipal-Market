import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import TextAreaField from './TextAreaField.jsx'

/** Confirms cancelling an order, with an optional reason shown to the other party. */
export default function CancelOrderDialog({ order, busy, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  return (
    <ConfirmDialog
      open={Boolean(order)}
      title={`Cancel order #${order?.orderNo ?? ''}?`}
      confirmLabel={busy ? 'Cancelling…' : 'Cancel order'}
      busy={busy}
      onConfirm={() => onConfirm(reason)}
      onCancel={() => {
        setReason('')
        onCancel()
      }}
    >
      <p>The items go back into stock. This can’t be undone.</p>
      <TextAreaField
        id="cancel-reason"
        label="Reason (optional)"
        rows={2}
        maxLength={300}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Ubos na po ang stock"
        className="mt-4 text-left"
      />
    </ConfirmDialog>
  )
}
