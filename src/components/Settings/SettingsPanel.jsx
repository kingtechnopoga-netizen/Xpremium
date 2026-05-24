import { useRef } from 'react'
import { Download, Upload, Trash2, RotateCcw } from 'lucide-react'
import Modal from '../UI/Modal'
import { useChatStore, DEFAULT_SYSTEM_PROMPT } from '../../store/chatStore'
import { downloadFile } from '../../lib/utils'
import { useToast } from '../UI/Toast'

export default function SettingsPanel({ open, onClose }) {
  const toast = useToast()
  const fileInput = useRef(null)

  const systemPrompt = useChatStore((s) => s.systemPrompt)
  const setSystemPrompt = useChatStore((s) => s.setSystemPrompt)
  const streaming = useChatStore((s) => s.streaming)
  const setStreaming = useChatStore((s) => s.setStreaming)
  const sendOnEnter = useChatStore((s) => s.sendOnEnter)
  const setSendOnEnter = useChatStore((s) => s.setSendOnEnter)
  const autoTitle = useChatStore((s) => s.autoTitle)
  const setAutoTitle = useChatStore((s) => s.setAutoTitle)
  const density = useChatStore((s) => s.density)
  const setDensity = useChatStore((s) => s.setDensity)
  const bgIntensity = useChatStore((s) => s.bgIntensity)
  const setBgIntensity = useChatStore((s) => s.setBgIntensity)

  const exportAll = useChatStore((s) => s.exportAll)
  const importAll = useChatStore((s) => s.importAll)
  const wipeAll = useChatStore((s) => s.wipeAll)

  const handleExport = () => {
    const data = exportAll()
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    downloadFile(`xprem-export-${ts}.json`, JSON.stringify(data, null, 2), 'application/json')
    toast.push('exported all data', { kind: 'success' })
  }

  const handleImport = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const text = await f.text()
      const json = JSON.parse(text)
      const ok = importAll(json)
      toast.push(ok ? 'imported successfully' : 'import skipped', { kind: ok ? 'success' : 'error' })
    } catch {
      toast.push('invalid file', { kind: 'error' })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings" subtitle="Tune the runtime to your taste." size="lg">
      <div className="space-y-5">
        <Section title="System prompt" hint="Sets the AI's persona for every conversation.">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="input-xp font-mono text-[12.5px] leading-relaxed"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              className="btn-ghost"
            >
              <RotateCcw size={12} /> Reset to default
            </button>
          </div>
        </Section>

        <Section title="Behavior">
          <Row label="Stream responses" hint="Token-by-token rendering.">
            <Switch checked={streaming} onChange={setStreaming} />
          </Row>
          <Row label="Send on Enter" hint="Off uses Ctrl/Cmd+Enter to send.">
            <Switch checked={sendOnEnter} onChange={setSendOnEnter} />
          </Row>
          <Row label="Auto-title chats" hint="Generate a concise title after the first reply.">
            <Switch checked={autoTitle} onChange={setAutoTitle} />
          </Row>
        </Section>

        <Section title="Appearance">
          <Row label="Density">
            <Segmented
              value={density}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
              onChange={setDensity}
            />
          </Row>
          <Row label="Background intensity" hint="Cinematic uses more particles & glow.">
            <Segmented
              value={bgIntensity}
              options={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'normal', label: 'Normal' },
                { value: 'cinematic', label: 'Cinematic' },
              ]}
              onChange={setBgIntensity}
            />
          </Row>
        </Section>

        <Section title="Data" hint="Everything is stored locally in your browser.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" onClick={handleExport} className="btn-ghost justify-center">
              <Download size={13} /> Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn-ghost justify-center"
            >
              <Upload size={13} /> Import JSON
            </button>
            <input ref={fileInput} type="file" accept="application/json" hidden onChange={handleImport} />
            <button
              type="button"
              onClick={() => {
                if (confirm('Wipe ALL local data (chats, folders, memory)? This cannot be undone.')) {
                  wipeAll()
                  toast.push('local data wiped', { kind: 'success' })
                }
              }}
              className="btn-ghost btn-danger justify-center"
            >
              <Trash2 size={13} /> Wipe all data
            </button>
          </div>
        </Section>
      </div>
    </Modal>
  )
}

function Section({ title, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-steel-400">{title}</div>
        {hint && <div className="text-[11px] text-steel-400/70">— {hint}</div>}
      </div>
      <div className="rounded-xl border hairline bg-white/[0.02] p-3">{children}</div>
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="text-sm text-steel-100">{label}</div>
        {hint && <div className="text-[11px] text-steel-400/80">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition ${
        checked
          ? 'border-emerald-glow/40 bg-emerald-glow/20'
          : 'border-white/[0.08] bg-white/[0.04]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full transition ${
          checked
            ? 'left-[22px] bg-gradient-to-br from-emerald-glow to-cyan-glow shadow-[0_0_12px_rgba(52,211,153,0.45)]'
            : 'left-0.5 bg-steel-200/90'
        }`}
      />
    </button>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-[12px] transition ${
            value === o.value
              ? 'bg-white/[0.07] text-white'
              : 'text-steel-300 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
