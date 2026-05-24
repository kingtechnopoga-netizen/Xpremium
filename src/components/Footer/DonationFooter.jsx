import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Copy, Check, ChevronUp } from 'lucide-react'
import { copyText } from '../../lib/utils'
import { useToast } from '../UI/Toast'

const GCASH_NUMBER = '09482887486'

/**
 * Donation footer.
 * Collapsed by default. Expands into a premium glass card.
 * Click the GCash badge to copy the number.
 */
export default function DonationFooter() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const onCopy = async () => {
    const ok = await copyText(GCASH_NUMBER)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.push('GCash number copied', { kind: 'success' })
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-40 hidden md:block">
      <div className="pointer-events-auto">
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.div
              key="open"
              initial={{ opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.985 }}
              transition={{ duration: 0.22 }}
              className="accent-border glass-strong w-[min(92vw,360px)] rounded-2xl shadow-glass-lg"
            >
              <div className="px-4 pt-3.5">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-glow/10 text-emerald-glow ring-1 ring-emerald-glow/25">
                    <Heart size={13} />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-steel-300">support the creator</div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="ml-auto rounded-md px-1.5 py-0.5 text-[11px] text-steel-400 hover:bg-white/[0.05] hover:text-white"
                  >
                    minimize
                  </button>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-steel-300">
                  If you enjoy using <span className="text-steel-100 font-medium">XPremChatbot</span> and want to support the creator,
                  you can donate <span className="text-emerald-glow">kahit barya lang</span>. Any amount is appreciated.
                </p>

                <button
                  type="button"
                  onClick={onCopy}
                  className="mt-3 group/g relative flex w-full items-center gap-3 rounded-xl border border-emerald-glow/25 bg-gradient-to-br from-emerald-glow/8 to-cyan-glow/6 px-3 py-2.5 transition hover:border-emerald-glow/45 hover:from-emerald-glow/14"
                  aria-label="Copy GCash number"
                >
                  <GCashBadge />
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-steel-400">gcash</div>
                    <div className="font-mono text-[14px] text-steel-100">{GCASH_NUMBER}</div>
                  </div>
                  <div className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-steel-300">
                    {copied ? (
                      <>
                        <Check size={12} className="text-emerald-glow" />
                        <span>copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>copy</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
              <div className="mt-3 border-t hairline px-4 py-2 text-[10.5px] uppercase tracking-[0.22em] text-steel-400/80">
                xpremchatbot · v1
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="closed"
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22 }}
              className="group/d glass-strong inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] text-steel-200 shadow-glass-lg transition hover:text-white"
              aria-label="Open donation panel"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-glow/15 text-emerald-glow ring-1 ring-emerald-glow/30">
                <Heart size={11} />
              </span>
              <span>Support the creator</span>
              <ChevronUp size={12} className="text-steel-400 transition group-hover/d:-translate-y-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function GCashBadge() {
  return (
    <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0070ff] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_28px_-8px_rgba(0,112,255,0.65)]">
      <span className="font-display text-[10px] font-bold tracking-wide">G</span>
      <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/15" />
      <span className="pointer-events-none absolute -inset-1 rounded-xl bg-[#0070ff]/30 blur-md opacity-60" />
    </div>
  )
}

/**
 * Inline donation strip used at the bottom of mobile view (since the floating
 * panel is desktop-only). Always rendered, compact and never spammy.
 */
export function MobileDonationStrip() {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    const ok = await copyText(GCASH_NUMBER)
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500) }
  }
  return (
    <div className="md:hidden">
      <div className="mx-auto max-w-3xl px-3 pb-2 pt-1">
        <div className="flex items-center gap-2 rounded-xl border hairline bg-white/[0.02] px-3 py-2 text-[11px] text-steel-300">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-glow/12 text-emerald-glow ring-1 ring-emerald-glow/25">
            <Heart size={10} />
          </span>
          <span className="truncate">
            Support the creator · GCash <span className="font-mono text-steel-100">{GCASH_NUMBER}</span>
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-steel-200 hover:text-white"
          >
            {copied ? <Check size={11} className="text-emerald-glow" /> : <Copy size={11} />}
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
