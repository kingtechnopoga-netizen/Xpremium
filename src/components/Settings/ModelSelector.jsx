import { useMemo, useState } from 'react'
import { Check, Search, Cpu } from 'lucide-react'
import Modal from '../UI/Modal'
import { MODELS } from '../../lib/puter'
import { useChatStore } from '../../store/chatStore'

/**
 * Model picker. Selecting a model:
 *  - Sets it as active for the current chat (if one exists)
 *  - Always updates the global default
 */
export default function ModelSelector({ open, onClose }) {
  const defaultModel = useChatStore((s) => s.defaultModel)
  const setDefaultModel = useChatStore((s) => s.setDefaultModel)
  const setChatModel = useChatStore((s) => s.setChatModel)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const [q, setQ] = useState('')

  const groups = useMemo(() => {
    const lower = q.trim().toLowerCase()
    const filtered = MODELS.filter((m) =>
      !lower ||
      m.label.toLowerCase().includes(lower) ||
      m.vendor.toLowerCase().includes(lower) ||
      m.id.toLowerCase().includes(lower) ||
      (m.tags || []).some((t) => t.toLowerCase().includes(lower))
    )
    const map = {}
    for (const m of filtered) {
      map[m.vendor] = map[m.vendor] || []
      map[m.vendor].push(m)
    }
    return map
  }, [q])

  const choose = (id) => {
    setDefaultModel(id)
    if (activeChatId) setChatModel(activeChatId, id)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select model"
      subtitle="All models route through puter.js — no API keys required."
      size="lg"
    >
      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search models, vendors, tags…"
          className="input-xp pl-9 text-sm"
          style={{ padding: '0.55rem 0.6rem 0.55rem 2rem' }}
        />
      </div>
      <div className="space-y-4">
        {Object.entries(groups).map(([vendor, items]) => (
          <div key={vendor}>
            <div className="mb-1.5 px-1 text-[10px] uppercase tracking-[0.22em] text-steel-400/80">{vendor}</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {items.map((m) => {
                const active = defaultModel === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => choose(m.id)}
                    className={`group/m relative flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? 'border-emerald-glow/40 bg-emerald-glow/8'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14]'
                    }`}
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        active
                          ? 'bg-emerald-glow/12 text-emerald-glow ring-1 ring-emerald-glow/25'
                          : 'bg-white/[0.03] text-steel-300'
                      }`}
                    >
                      <Cpu size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-[13.5px] font-medium text-steel-100">{m.label}</div>
                        {active && <Check size={12} className="text-emerald-glow" />}
                      </div>
                      <div className="truncate text-[11px] font-mono text-steel-400/80">{m.id}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(m.tags || []).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-[1px] text-[10px] uppercase tracking-[0.14em] text-steel-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {Object.keys(groups).length === 0 && (
          <div className="rounded-xl border hairline bg-white/[0.02] px-4 py-6 text-center text-sm text-steel-400">
            No models match "{q}".
          </div>
        )}
      </div>
    </Modal>
  )
}
