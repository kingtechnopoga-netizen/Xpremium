import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp, Image as ImageIcon, Paperclip, Square, X, Cpu, Sparkles, Plus, Globe,
} from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { readAsDataURL, readAsText } from '../../lib/utils'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_FILE_BYTES = 200 * 1024        // 200KB inlined as text

/**
 * Premium mobile-first composer.
 *
 * Mobile (≤ sm): single compact row — `+` button (attach + mode), textarea, send.
 *                Mode is shown as a subtle label inside the input placeholder.
 * Desktop:       full row with mode pills, attach buttons, model chip, send.
 */
export default function Composer({ onSend, isStreaming, onStop, onPickModel }) {
  const sendOnEnter = useChatStore((s) => s.sendOnEnter)
  const model = useChatStore((s) => s.getActiveModel())
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [mode, setMode] = useState('chat') // 'chat' | 'code' | 'web'
  const [moreOpen, setMoreOpen] = useState(false)
  const taRef = useRef(null)
  const imgInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const moreRef = useRef(null)

  // Auto-grow textarea — bounded so it never eats the chat
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = '0px'
    const max = window.innerWidth < 768 ? 140 : 240
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [text])

  // Close the mobile "more" sheet on outside tap
  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
    }
  }, [moreOpen])

  const canSend = !isStreaming && (text.trim().length > 0 || images.length > 0 || files.length > 0)

  const handleSend = () => {
    if (!canSend) return
    const decorated = decorateForMode(text, mode, files)
    onSend?.({
      content: decorated,
      images: images.map((i) => i.url),
      attachments: files.map((f) => ({ name: f.name, size: f.size })),
    })
    setText('')
    setImages([])
    setFiles([])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (sendOnEnter && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      } else if (!sendOnEnter && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSend()
      }
    }
  }

  const onPickImages = async (e) => {
    const list = Array.from(e.target.files || [])
    e.target.value = ''
    const next = []
    for (const f of list) {
      if (!f.type.startsWith('image/')) continue
      if (f.size > MAX_IMAGE_BYTES) continue
      const url = await readAsDataURL(f)
      next.push({ name: f.name, url })
    }
    setImages((s) => [...s, ...next].slice(0, 4))
    setMoreOpen(false)
  }

  const onPickFiles = async (e) => {
    const list = Array.from(e.target.files || [])
    e.target.value = ''
    const next = []
    for (const f of list) {
      if (f.size > MAX_FILE_BYTES) continue
      const text = await readAsText(f).catch(() => '')
      next.push({ name: f.name, size: f.size, text })
    }
    setFiles((s) => [...s, ...next].slice(0, 6))
    setMoreOpen(false)
  }

  const placeholder =
    mode === 'code' ? 'Describe code or paste a snippet…'
    : mode === 'web' ? 'Ask a question, citing real-world context…'
    : 'Message XPremChatbot'

  return (
    <div className="relative">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="accent-border glass-strong rounded-2xl shadow-glass-lg"
      >
        <div className="px-2.5 pt-2.5 sm:px-3 sm:pt-3">
          {/* Mode label (mobile only, when not chat) */}
          {mode !== 'chat' && (
            <div className="mb-1.5 flex items-center gap-1.5 sm:hidden">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-glow/30 bg-emerald-glow/10 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-emerald-glow">
                {mode === 'code' ? <Cpu size={10} /> : <Globe size={10} />}
                {mode}
              </span>
              <button
                type="button"
                onClick={() => setMode('chat')}
                className="text-[10px] uppercase tracking-[0.16em] text-steel-400 hover:text-white"
                aria-label="Reset to chat mode"
              >
                clear
              </button>
            </div>
          )}

          {/* Attachments preview */}
          {(images.length > 0 || files.length > 0) && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-12 w-12 rounded-md border border-white/[0.08] object-cover sm:h-14 sm:w-14"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((s) => s.filter((_, idx) => idx !== i))}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-ink-900 text-steel-300 hover:text-white"
                    aria-label="Remove image"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex max-w-[180px] items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-steel-200"
                  title={f.name}
                >
                  <Paperclip size={11} className="shrink-0 text-steel-400" />
                  <span className="truncate font-mono text-[11px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((s) => s.filter((_, idx) => idx !== i))}
                    className="text-steel-400 hover:text-white"
                    aria-label="Remove file"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] leading-snug text-steel-100 placeholder:text-steel-400/70 focus:outline-none"
            style={{ minHeight: 22 }}
          />
        </div>

        {/* ── Mobile: compact single row ──────────────────────────── */}
        <div className="flex items-center gap-1 px-2 pb-2 pt-1 sm:hidden">
          {/* "+" attach/mode menu */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
                moreOpen
                  ? 'border-white/[0.16] bg-white/[0.06] text-white'
                  : 'border-white/[0.06] bg-white/[0.02] text-steel-300'
              }`}
              aria-label="Attach or change mode"
              aria-expanded={moreOpen}
            >
              <Plus size={16} className={moreOpen ? 'rotate-45 transition' : 'transition'} />
            </button>

            {moreOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-[200px] glass-strong rounded-xl p-1 shadow-glass-lg">
                <MenuItem icon={<ImageIcon size={13} />} label="Attach image" onClick={() => imgInputRef.current?.click()} />
                <MenuItem icon={<Paperclip size={13} />} label="Attach file" onClick={() => fileInputRef.current?.click()} />
                <div className="my-1 border-t hairline" />
                <div className="px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-steel-400/80">mode</div>
                <MenuItem
                  icon={<Sparkles size={13} className={mode === 'chat' ? 'text-emerald-glow' : ''} />}
                  label="Chat"
                  active={mode === 'chat'}
                  onClick={() => { setMode('chat'); setMoreOpen(false) }}
                />
                <MenuItem
                  icon={<Cpu size={13} className={mode === 'code' ? 'text-emerald-glow' : ''} />}
                  label="Coding"
                  active={mode === 'code'}
                  onClick={() => { setMode('code'); setMoreOpen(false) }}
                />
                <MenuItem
                  icon={<Globe size={13} className={mode === 'web' ? 'text-emerald-glow' : ''} />}
                  label="Web search"
                  active={mode === 'web'}
                  onClick={() => { setMode('web'); setMoreOpen(false) }}
                />
              </div>
            )}
          </div>

          {/* Spacer / model name */}
          <button
            type="button"
            onClick={onPickModel}
            className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-steel-300 active:bg-white/[0.05]"
            title={model.label}
          >
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-glow/70" />
            <span className="truncate">{model.label}</span>
          </button>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="grid h-9 w-9 place-items-center rounded-xl border border-red-400/40 bg-red-400/10 text-red-300"
              aria-label="Stop generation"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
                canSend
                  ? 'border-emerald-glow/40 bg-gradient-to-br from-emerald-glow/20 to-cyan-glow/20 text-emerald-glow shadow-emerald-soft'
                  : 'border-white/[0.06] bg-white/[0.02] text-steel-400'
              }`}
              aria-label="Send"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>

        {/* ── Desktop: full row ───────────────────────────────────── */}
        <div className="hidden items-center gap-1 px-2.5 pb-2.5 pt-1.5 sm:flex">
          <ChipButton onClick={() => imgInputRef.current?.click()} aria-label="Attach image">
            <ImageIcon size={14} />
            <span>image</span>
          </ChipButton>
          <ChipButton onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
            <Paperclip size={14} />
            <span>file</span>
          </ChipButton>

          <div className="mx-1 h-5 w-px bg-white/[0.06]" />

          <ModePill active={mode === 'chat'} onClick={() => setMode('chat')} icon={<Sparkles size={12} />}>
            chat
          </ModePill>
          <ModePill active={mode === 'code'} onClick={() => setMode('code')} icon={<Cpu size={12} />}>
            code
          </ModePill>
          <ModePill active={mode === 'web'} onClick={() => setMode('web')} icon={<Globe size={12} />}>
            search
          </ModePill>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onPickModel}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-steel-300 hover:bg-white/[0.05] hover:text-white"
              title={model.label}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-glow/70" />
              <span className="normal-case tracking-normal">{model.label}</span>
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="btn-ghost btn-danger"
                aria-label="Stop generation"
              >
                <Square size={14} />
                <span>stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
                  canSend
                    ? 'border-emerald-glow/40 bg-gradient-to-br from-emerald-glow/20 to-cyan-glow/20 text-emerald-glow shadow-emerald-soft hover:from-emerald-glow/30 hover:to-cyan-glow/30'
                    : 'border-white/[0.06] bg-white/[0.02] text-steel-400'
                }`}
                aria-label="Send"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <input ref={imgInputRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
      <input ref={fileInputRef} type="file" multiple hidden onChange={onPickFiles} />

      <div className="mt-1 hidden text-center text-[11px] text-steel-400/70 sm:block">
        Powered by puter.js · multi-model · streaming
      </div>
    </div>
  )
}

function decorateForMode(text, mode, files) {
  let out = text.trim()
  if (mode === 'code') {
    out = `[mode: coding]\n\n${out || 'Help me with this:'}`
  } else if (mode === 'web') {
    out = `[mode: web-search]\n\nResearch question:\n${out}\n\nIf real-time web access isn't available, answer with best-known facts and clearly mark uncertainty.`
  }
  if (files?.length) {
    const blocks = files
      .filter((f) => f.text)
      .map((f) => '\n\n--- file: ' + f.name + ' ---\n```\n' + (f.text || '').slice(0, 24000) + '\n```')
      .join('')
    out += blocks
  }
  return out
}

function ChipButton({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-steel-300 transition hover:bg-white/[0.05] hover:text-white"
    >
      {children}
    </button>
  )
}

function ModePill({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] transition ${
        active
          ? 'border-emerald-glow/35 bg-emerald-glow/10 text-emerald-glow'
          : 'border-white/[0.06] bg-white/[0.02] text-steel-400 hover:text-steel-200'
      }`}
    >
      <span className="opacity-90">{icon}</span>
      <span className="normal-case tracking-normal">{children}</span>
    </button>
  )
}

function MenuItem({ icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
        active ? 'text-emerald-glow' : 'text-steel-200'
      } hover:bg-white/[0.05]`}
    >
      <span className="opacity-80">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}
