import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Copy, Check, RotateCcw, Pencil, Trash2, Square, ArrowDownToLine, User, Sparkles,
} from 'lucide-react'
import Markdown from './Markdown'
import { copyText, formatTime } from '../../lib/utils'

/**
 * One chat message bubble. Supports:
 *  - streaming state (live cursor + stop button)
 *  - markdown rendering
 *  - copy / regenerate / continue / edit / delete
 *  - image attachments
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
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar isUser={isUser} />
        <div className={`min-w-0 flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
          <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-steel-400">
            <span>{isUser ? 'operator' : 'xprem'}</span>
            {msg.model && !isUser && (
              <span className="text-steel-400/70 normal-case tracking-normal">· {msg.model}</span>
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
                  className="max-h-48 max-w-[240px] rounded-lg border border-white/[0.06] object-cover"
                />
              ))}
            </div>
          )}

          {!!msg.attachments?.length && (
            <div className={`mb-2 flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`}>
              {msg.attachments.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-steel-300"
                  title={a.name}
                >
                  <span className="font-mono">{a.name}</span>
                  <span className="ml-2 text-steel-400/70">{Math.round((a.size || 0) / 1024)} KB</span>
                </div>
              ))}
            </div>
          )}

          <Bubble role={msg.role}>
            {msg.error ? (
              <div className="font-mono text-sm text-red-300">
                ⚠ {msg.error}
              </div>
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
              className={`mt-1.5 flex flex-wrap gap-1 text-steel-400 transition-opacity ${
                isUser ? 'justify-end' : ''
              } ${isStreaming || isLast ? 'opacity-100' : 'opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100'}`}
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
                      <ToolbarBtn icon={<RotateCcw size={12} />} label="regenerate" onClick={onRegenerate} />
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
      className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
        isUser
          ? 'border-white/[0.06] bg-white/[0.03] text-steel-200'
          : 'border-emerald-glow/25 bg-gradient-to-br from-emerald-glow/10 to-cyan-glow/10 text-emerald-glow'
      }`}
    >
      {isUser ? <User size={14} /> : <Sparkles size={14} />}
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
        'rounded-2xl px-4 py-3',
        'border border-white/[0.06]',
        isUser
          ? 'bg-gradient-to-br from-white/[0.045] to-white/[0.02]'
          : 'bg-gradient-to-br from-ink-800/85 to-ink-900/90',
        'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_30px_-12px_rgba(0,0,0,0.6)]',
        isUser ? 'max-w-[88%]' : 'max-w-[94%]',
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
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.14em] transition ${
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
