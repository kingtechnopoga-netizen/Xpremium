import { Code2, Globe, Lightbulb, Sparkles } from 'lucide-react'
import { BrandLogo } from '../UI/Brand'

const SUGGESTIONS = [
  {
    icon: <Code2 size={14} />,
    title: 'Write a production-grade React hook',
    body: 'Implement useDebouncedCallback with cleanup and TS types.',
  },
  {
    icon: <Lightbulb size={14} />,
    title: 'Architect a streaming chat backend',
    body: 'Design SSE-based fanout with backpressure and reconnects.',
  },
  {
    icon: <Globe size={14} />,
    title: 'Explain BGP hijacking',
    body: 'Cover the protocol, real incidents, and modern mitigations (RPKI).',
  },
  {
    icon: <Sparkles size={14} />,
    title: 'Generate a stealth landing page',
    body: 'Tailwind dark theme, glass cards, subtle aurora background.',
  },
]

export default function EmptyState({ onSuggest }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-3 py-6 text-center sm:px-4 sm:py-10">
      <div className="relative mb-4 grid h-12 w-12 place-items-center rounded-2xl glass-strong shadow-glass-lg sm:mb-5 sm:h-14 sm:w-14">
        <BrandLogo size={26} />
        <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-emerald-glow/5 blur-2xl" />
      </div>
      <h1 className="font-display text-2xl tracking-tight text-gradient sm:text-3xl">
        How can I help today?
      </h1>
      <p className="mt-2 max-w-md text-[13px] text-steel-400 sm:text-sm">
        Encrypted, multi-model intelligence. Stream responses, render markdown,
        debug code — engineered for elite operators.
      </p>

      <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:mt-7 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onSuggest?.(`${s.title}\n\n${s.body}`)}
            className="group/sg relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04] sm:px-3.5 sm:py-3"
          >
            <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-steel-400 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="text-emerald-glow">{s.icon}</span>
              <span>suggestion</span>
            </div>
            <div className="text-[13.5px] font-medium text-steel-100 sm:text-sm">{s.title}</div>
            <div className="mt-0.5 text-[11.5px] text-steel-400 sm:text-xs">{s.body}</div>
            <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover/sg:opacity-100">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-glow/40 to-transparent" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
