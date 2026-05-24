import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUp, Image as ImageIcon, Paperclip, Square, X, Cpu, Sparkles,
} from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { readAsDataURL, readAsText } from '../../lib/utils'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_FILE_BYTES = 200 * 1024        // 200KB inlined as text

/**
 * The premium AI composer.
 * - Auto-growing textarea (mobile-safe)
 * - Image + file attachments
 * - Streaming send / abort
 * - Model + mode chips
 */
export default function Composer({ onSend, isStreaming, onStop, onPickModel }) {
  const sendOnEnter = useChatStore((s) => s.sendOnEnter)
  const model = useChatStore((s) => s.getActiveModel())
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [mode, setMode] = useState('chat') // 'chat' | 'code' | 'web'
  const taRef = useRef(null)
  const imgInputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = '0px'
    const max = window.innerWidth < 768 ? 200 : 280
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [text])

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
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="accent-border glass-strong rounded-2xl shadow-glass-lg"
      >
        <div className="px-3 pt-3">
          {/* Attachments preview */}
          {(images.length > 0 || files.length > 0) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-14 w-14 rounded-md border border-white/[0.08] object-cover"
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
                  className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-steel-200"
                  title={f.name}
                >
                  <Paperclip size={12} className="text-steel-400" />
                  <span className="max-w-[160px] truncate font-mono">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((s) => s.filter((_, idx) => idx !== i))}
                    className="text-steel-400 hover:text-white"
                    aria-label="Remove file"
                  >
                    <X size={12} />
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
            placeholder={
              mode === 'code'
                ? 'Describe code, paste a snippet, or ask for a refactor…'
                : mode === 'web'
                ? 'Ask a question that benefits from current context…'
                : 'Message XPremChatbot — Shift+Enter for newline'
            }
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-steel-100 placeholder:text-steel-400/70 focus:outline-none"
            style={{ minHeight: 24 }}
          />
        </div>

        {/* Bottom action row */}
        <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1.5">
          <ChipButton onClick={() => imgInputRef.current?.click()} aria-label="Attach image">
            <ImageIcon size={14} />
            <span className="hidden sm:inline">image</span>
          </ChipButton>
          <ChipButton onClick={() => fileInputRef.current?.click()} aria-label="Attach file">
            <Paperclip size={14} />
            <span className="hidden sm:inline">file</span>
          </ChipButton>

          <div className="mx-1 h-5 w-px bg-white/[0.06]" />

          <ModePill active={mode === 'chat'} onClick={() => setMode('chat')} icon={<Sparkles size={12} />}>
            chat
          </ModePill>
          <ModePill active={mode === 'code'} onClick={() => setMode('code')} icon={<Cpu size={12} />}>
            code
          </ModePill>
          <ModePill active={mode === 'web'} onClick={() => setMode('web')} icon={<span className="font-mono text-[10px]">web</span>}>
            search
          </ModePill>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onPickModel}
              className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] uppercase tracking-[0.16em] text-steel-300 hover:bg-white/[0.05] hover:text-white sm:inline-flex"
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
                <span className="hidden sm:inline">stop</span>
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

      <div className="mt-1.5 px-1 text-center text-[11px] text-steel-400/70">
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
