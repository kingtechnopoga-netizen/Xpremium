import { Menu, Code2, MessageSquare, Plus, Cpu } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { BrandLogo, BrandWordmark } from '../UI/Brand'

/**
 * Top bar:
 *  - Mobile: slim 48px bar — hamburger + brand + new-chat (no extra chips)
 *  - Desktop: 56px bar — chat title + active model chip + view toggle
 */
export default function TopBar({ onPickModel }) {
  const view = useChatStore((s) => s.view)
  const setView = useChatStore((s) => s.setView)
  const toggleSidebar = useChatStore((s) => s.toggleSidebar)
  const newChat = useChatStore((s) => s.newChat)
  const chat = useChatStore((s) => s.getActiveChat())
  const model = useChatStore((s) => s.getActiveModel())

  return (
    <header className="relative z-20 flex h-12 md:h-14 items-center gap-2 border-b hairline px-2.5 sm:px-4 glass safe-top">
      <button
        type="button"
        onClick={toggleSidebar}
        className="grid h-9 w-9 place-items-center rounded-lg text-steel-300 hover:bg-white/[0.05] hover:text-white md:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile: brand + truncated chat title (one line) */}
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md glass-strong">
          <BrandLogo size={16} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-steel-100 leading-tight">
            {chat?.title && chat.title !== 'New conversation' ? chat.title : 'XPremChatbot'}
          </div>
          {chat?.title && chat.title !== 'New conversation' && (
            <div className="truncate text-[10px] uppercase tracking-[0.2em] text-steel-400/80 leading-tight">
              {model.label}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: chat title + meta */}
      <div className="hidden flex-1 items-center gap-3 md:flex">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-steel-100">
            {chat?.title || 'New conversation'}
          </div>
          <div className="text-[11px] text-steel-400">
            {chat ? `${chat.messages?.length || 0} messages` : 'Start a new conversation'}
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPickModel}
          className="hidden items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-steel-200 transition hover:border-white/[0.12] hover:text-white sm:inline-flex"
          title="Switch model"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-glow/80" />
          <Cpu size={12} className="text-steel-400" />
          <span>{model.label}</span>
        </button>

        <div className="hidden items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 md:inline-flex">
          <ToggleBtn active={view === 'chat'} onClick={() => setView('chat')}>
            <MessageSquare size={12} /> Chat
          </ToggleBtn>
          <ToggleBtn active={view === 'codex'} onClick={() => setView('codex')}>
            <Code2 size={12} /> Codex
          </ToggleBtn>
        </div>

        <button
          type="button"
          onClick={() => newChat()}
          className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-glow/25 bg-gradient-to-br from-emerald-glow/10 to-cyan-glow/10 text-emerald-glow shadow-emerald-soft hover:from-emerald-glow/20 hover:to-cyan-glow/20"
          aria-label="New chat"
        >
          <Plus size={16} />
        </button>
      </div>
    </header>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition ${
        active
          ? 'bg-white/[0.06] text-white'
          : 'text-steel-300 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
