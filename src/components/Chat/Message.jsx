import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Copy, Check, RotateCcw, Pencil, Trash2, Square, ArrowDownToLine, User, Sparkles,
} from 'lucide-react'
import Markdown from './Markdown'
import { copyText, formatTime } from '../../lib/utils'

/**
 * Chat message bubble — supports streaming, markdown, image attachments,
 * and message-level actions (copy / regenerate / continue / edit / delete / stop).
 *
 * Mobile-tight: tighter avatar + gap, wider bubbles, compact action toolbar.
 */
export default function Message({
  msg,
  isLast,
  isStreaming,
  onCopy,
  onRegenerate,
  onContinue,
  onEdit,
  onDelete,
  onStop,
}) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const handleCopy = async () => {
    const ok = await copyText(msg.content || '')
    onCopy?.(ok)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
      className="group/msg relative"
    >
      <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar isUser={isUser} />
        <div className={`min-w-0 flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-steel-400 sm:text-[11px] sm:tracking-[0.18em]">
            <span>{isUser ? 'operator' : 'xprem'}</span>
            {msg.model && !isUser && (
              <span className="hidden text-steel-400/70 normal-case tracking-normal sm:inline">· {msg.model}</span>
            )}
            <span className="text-steel-400/60 normal-case tracking-normal">· {formatTime(msg.createdAt)}</span>
          </div>

          {!!msg.images?.length && (
            <div className={`mb-2 flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`}>
              {msg.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="attachment"
                  className="max-h-40 max-w-[80vw] rounded-lg border border-white/[0.06] object-cover sm:max-h-48 sm:max-w-[240px]"
                />
              ))}
            </div>
          )}

          {!!msg.attachments?.length && (
            <div className={`mb-2 flex flex-wrap gap-1.5 ${isUser ? 'justify-end' : ''}`}>
              {msg.attachments.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] text-steel-300"
                  title={a.name}
                >
                  <span className="font-mono">{a.name}</span>
                  <span className="ml-1.5 text-steel-400/70">{Math.round((a.size || 0) / 1024)} KB</span>
                </div>
              ))}
            </div>
          )}

          <Bubble role={msg.role}>
            {msg.error ? (
              <div className="font-mono text-sm text-red-300">⚠ {msg.error}</div>
            ) : (
              <Markdown content={msg.content || (isStreaming ? '' : '')} />
            )}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-3 w-[7px] translate-y-[2px] bg-emerald-glow/80 align-middle animate-pulse" />
            )}
          </Bubble>

          {/* Action toolbar */}
          {!msg.error && (
            <div
              className={`mt-1 flex flex-wrap gap-0.5 text-steel-400 transition-opacity sm:mt-1.5 sm:gap-1 ${
                isUser ? 'justify-end' : ''
              } ${isStreaming || isLast ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover/msg:opacity-100 sm:focus-within:opacity-100'}`}
            >
              {isStreaming ? (
                <ToolbarBtn icon={<Square size={12} />} label="stop" onClick={onStop} danger />
              ) : (
                <>
                  <ToolbarBtn
                    icon={copied ? <Check size={12} className="text-emerald-glow" /> : <Copy size={12} />}
                    label={copied ? 'copied' : 'copy'}
                    onClick={handleCopy}
                  />
                  {!isUser && (
                    <>
                      <ToolbarBtn icon={<RotateCcw size={12} />} label="regen" onClick={onRegenerate} />
                      {isLast && (
                        <ToolbarBtn icon={<ArrowDownToLine size={12} />} label="continue" onClick={onContinue} />
                      )}
                    </>
                  )}
                  {isUser && <ToolbarBtn icon={<Pencil size={12} />} label="edit" onClick={onEdit} />}
                  <ToolbarBtn icon={<Trash2 size={12} />} label="delete" onClick={onDelete} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Avatar({ isUser }) {
  return (
    <div
      className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-lg border sm:h-8 sm:w-8 ${
        isUser
          ? 'border-white/[0.06] bg-white/[0.03] text-steel-200'
          : 'border-emerald-glow/25 bg-gradient-to-br from-emerald-glow/10 to-cyan-glow/10 text-emerald-glow'
      }`}
    >
      {isUser ? <User size={13} /> : <Sparkles size={13} />}
      {!isUser && (
        <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-emerald-glow/15" />
      )}
    </div>
  )
}

function Bubble({ role, children }) {
  const isUser = role === 'user'
  return (
    <div
      className={[
        'min-w-0 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3',
        'border border-white/[0.06]',
        isUser
          ? 'bg-gradient-to-br from-white/[0.045] to-white/[0.02]'
          : 'bg-gradient-to-br from-ink-800/85 to-ink-900/90',
        'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_30px_-12px_rgba(0,0,0,0.6)]',
        // On mobile let bubbles use full available width; on sm+ keep classic chat width.
        isUser ? 'max-w-full sm:max-w-[88%]' : 'max-w-full sm:max-w-[94%]',
        'break-words',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function ToolbarBtn({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.12em] transition sm:px-2 sm:py-1 sm:text-[11px] sm:tracking-[0.14em] ${
        danger
          ? 'text-red-300 hover:bg-red-400/10'
          : 'hover:bg-white/[0.05] hover:text-steel-100'
      }`}
    >
      {icon}
      <span className="normal-case tracking-normal">{label}</span>
    </button>
  )
}
