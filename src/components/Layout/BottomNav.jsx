import { MessageSquare, Code2, Cpu, Brain, Settings } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'

/**
 * Mobile-only thumb-friendly bottom navigation.
 * Sits above the keyboard with safe-area padding.
 */
export default function BottomNav({ onPickModel }) {
  const view = useChatStore((s) => s.view)
  const setView = useChatStore((s) => s.setView)
  const setMemoryOpen = useChatStore((s) => s.setMemoryOpen)
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen)

  return (
    <nav className="relative z-10 flex items-center justify-around border-t hairline glass safe-bottom md:hidden">
      <NavBtn active={view === 'chat'} onClick={() => setView('chat')} icon={<MessageSquare size={16} />} label="Chat" />
      <NavBtn active={view === 'codex'} onClick={() => setView('codex')} icon={<Code2 size={16} />} label="Codex" />
      <NavBtn onClick={onPickModel} icon={<Cpu size={16} />} label="Model" />
      <NavBtn onClick={() => setMemoryOpen(true)} icon={<Brain size={16} />} label="Memory" />
      <NavBtn onClick={() => setSettingsOpen(true)} icon={<Settings size={16} />} label="Settings" />
    </nav>
  )
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/nav flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-[10px] transition ${
        active ? 'text-emerald-glow' : 'text-steel-400'
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-lg transition ${
          active ? 'bg-emerald-glow/12 ring-1 ring-emerald-glow/25' : 'group-hover/nav:bg-white/[0.04]'
        }`}
      >
        {icon}
      </span>
      <span className="uppercase tracking-[0.18em]">{label}</span>
    </button>
  )
}
