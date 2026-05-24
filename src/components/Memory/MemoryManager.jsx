import { useEffect, useState } from 'react'
import { Save, Trash2, Plus, Brain } from 'lucide-react'
import Modal from '../UI/Modal'
import { useChatStore } from '../../store/chatStore'
import { useToast } from '../UI/Toast'

const QUICK_LINES = [
  'My name is …',
  'I work as a …',
  'My preferred coding stack is …',
  'Always reply in concise, technical English.',
  'When generating code, prefer TypeScript and modern syntax.',
]

/**
 * Persistent memory editor — content is appended to the system prompt
 * on every request via buildMessages() in lib/puter.js.
 */
export default function MemoryManager({ open, onClose }) {
  const memory = useChatStore((s) => s.memory)
  const setMemory = useChatStore((s) => s.setMemory)
  const [draft, setDraft] = useState(memory)
  const toast = useToast()

  useEffect(() => { if (open) setDraft(memory) }, [open, memory])

  const save = () => {
    setMemory(draft)
    toast.push('memory saved', { kind: 'success' })
    onClose?.()
  }

  const append = (line) => {
    const sep = draft && !draft.endsWith('\n') ? '\n' : ''
    setDraft((draft || '') + sep + line)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI memory"
      subtitle="Persistent facts the assistant remembers across all chats."
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all memory?')) {
                setDraft('')
                setMemory('')
              }
            }}
            className="btn-ghost btn-danger"
          >
            <Trash2 size={12} /> Clear
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="button" onClick={save} className="btn-primary">
              <Save size={12} /> Save memory
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-3 flex items-start gap-3 rounded-xl border hairline bg-white/[0.02] p-3 text-[12.5px] text-steel-300">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-glow/10 text-emerald-glow ring-1 ring-emerald-glow/25">
          <Brain size={14} />
        </div>
        <div>
          Memory is injected into every conversation as a hidden system note.
          Use it for stable facts: name, stack, tone, language preferences.
        </div>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={10}
        placeholder="e.g. I'm a senior backend engineer focused on Go and Postgres. Reply in concise, technical English."
        className="input-xp font-mono text-[12.5px] leading-relaxed"
      />

      <div className="mt-3">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-steel-400">quick add</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_LINES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => append(q)}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-steel-300 transition hover:border-white/[0.14] hover:text-white"
            >
              <Plus size={10} /> {q}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
