import { MUNICIPALITY_LABEL } from '../lib/config.js'
import { backendMode } from '../services/index.js'

export default function Footer() {
  return (
    <footer className="border-t border-[#e8e1cf] px-4 py-8 text-center text-sm text-muted">
      <p>© {new Date().getFullYear()} Bayanihan Market · Supporting local sellers of {MUNICIPALITY_LABEL}</p>
      {backendMode === 'mock' && (
        <p className="mt-1 text-xs">Mock data mode: data is saved only in this browser and is not shared between devices.</p>
      )}
    </footer>
  )
}
