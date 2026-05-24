import { Sparkles } from 'lucide-react'

export default function TypingIndicator({ label = 'thinking' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-glow/25 bg-gradient-to-br from-emerald-glow/10 to-cyan-glow/10 text-emerald-glow">
        <Sparkles size={14} />
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-ink-900/80 px-3.5 py-2.5 shadow-glass">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-steel-400">{label}</span>
        </div>
      </div>
    </div>
  )
}
