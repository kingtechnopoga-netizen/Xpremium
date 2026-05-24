import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { uid } from '../../lib/utils'

const ToastCtx = createContext({ push: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((msg, opts = {}) => {
    const id = uid('t')
    const t = { id, msg, kind: opts.kind || 'info', ttl: opts.ttl ?? 2400 }
    setToasts((s) => [...s, t])
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), t.ttl)
  }, [])

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[180] flex flex-col items-center gap-2 px-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="pointer-events-auto glass-strong rounded-xl px-3.5 py-2.5 text-sm text-steel-100 shadow-glass-lg"
            >
              <span
                className={
                  t.kind === 'error'
                    ? 'text-red-300'
                    : t.kind === 'success'
                    ? 'text-emerald-glow'
                    : 'text-steel-100'
                }
              >
                {t.msg}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}
