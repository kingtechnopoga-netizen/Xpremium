import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Premium glass modal with backdrop blur and ESC handling.
 * Mobile: bottom-sheet style. Desktop: centered card.
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const widths = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
        >
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close"
          />
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            className={`relative w-full ${widths[size]} accent-border glass-strong shadow-glass-lg sm:rounded-2xl rounded-t-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col safe-bottom`}
          >
            <div className="flex items-start gap-3 border-b hairline px-5 py-4">
              <div className="min-w-0 flex-1">
                {title && <div className="font-display text-lg tracking-tight text-white">{title}</div>}
                {subtitle && <div className="mt-0.5 text-[12px] text-steel-400">{subtitle}</div>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-steel-300 hover:bg-white/[0.05] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="border-t hairline px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
