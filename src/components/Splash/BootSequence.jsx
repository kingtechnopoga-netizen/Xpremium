import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BOOT_LINES = [
  '▸ initializing xprem kernel ............................. ok',
  '▸ mounting encrypted memory volume ....................... ok',
  '▸ loading multi-model inference matrix ................... ok',
  '▸ negotiating puter.js runtime channel ................... ok',
  '▸ verifying stealth signature ............................ ok',
  '▸ starting cinematic compositor .......................... ok',
  '▸ welcome, operator',
]

/**
 * Cinematic boot sequence shown once per session.
 * Renders quickly, then fades out and unmounts.
 */
export default function BootSequence({ onDone }) {
  const [shown, setShown] = useState(0)
  const [done, setDone] = useState(false)
  const timer = useRef(null)
  const sessionFlag = useRef(false)

  useEffect(() => {
    // Skip the boot sequence on subsequent in-session reloads via React StrictMode
    if (sessionStorage.getItem('xp-boot-shown') === '1') {
      sessionFlag.current = true
      setDone(true)
      const t = setTimeout(() => onDone?.(), 50)
      return () => clearTimeout(t)
    }

    let i = 0
    const tick = () => {
      i += 1
      setShown(i)
      if (i >= BOOT_LINES.length) {
        setTimeout(() => {
          sessionStorage.setItem('xp-boot-shown', '1')
          setDone(true)
          setTimeout(() => onDone?.(), 600)
        }, 320)
        return
      }
      timer.current = setTimeout(tick, 140 + Math.random() * 110)
    }
    timer.current = setTimeout(tick, 280)
    return () => clearTimeout(timer.current)
  }, [onDone])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="boot"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 35%, rgba(16,22,32,0.95) 0%, #05070a 70%)',
          }}
        >
          {/* Subtle scanlines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)',
            }}
          />
          <div className="absolute inset-0 noise opacity-40 mix-blend-overlay pointer-events-none" />

          <div className="relative w-[min(92vw,560px)] px-6">
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex items-center gap-3"
            >
              <BrandMark />
              <div>
                <div className="font-display text-2xl tracking-tight text-white">
                  XPrem<span className="text-accent-gradient">Chatbot</span>
                </div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-steel-400">
                  elite ai operating system
                </div>
              </div>
            </motion.div>

            <div className="font-mono text-[12.5px] leading-[1.9] text-steel-300/85">
              {BOOT_LINES.slice(0, shown).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={i === BOOT_LINES.length - 1 ? 'text-accent-gradient' : ''}
                >
                  {line}
                </motion.div>
              ))}
              {shown < BOOT_LINES.length && (
                <span className="ml-1 inline-block h-3 w-[8px] translate-y-[2px] bg-emerald-glow/80 align-middle animate-pulse" />
              )}
            </div>

            <div className="mt-8 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(52,211,153,0.6), rgba(56,189,248,0.6))',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${(shown / BOOT_LINES.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BrandMark() {
  return (
    <div className="relative grid h-11 w-11 place-items-center rounded-xl glass-strong shadow-glass">
      <svg viewBox="0 0 64 64" className="h-7 w-7">
        <defs>
          <linearGradient id="bg-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path
          d="M18 18 L32 32 L18 46 M46 18 L32 32 L46 46"
          fill="none"
          stroke="url(#bg-grad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="32" r="2.2" fill="#e6e9ef" />
      </svg>
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/5" />
    </div>
  )
}
