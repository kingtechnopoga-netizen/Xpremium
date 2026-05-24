import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pin, PinOff, Folder, FolderPlus, Trash2, Pencil, MoreHorizontal,
  X, ChevronDown, ChevronRight, Cpu, Brain, Settings, Code2, MessageSquare,
  Heart, Copy, Check,
} from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { BrandLogo, BrandWordmark } from '../UI/Brand'
import { relativeTime } from '../../lib/utils'

/**
 * Sidebar with:
 *  - Brand header
 *  - Search
 *  - Pinned chats
 *  - Folders (collapsible)
 *  - Recent chats
 *  - Footer actions (memory, settings, codex)
 *
 * On mobile, mounts as a slide-in overlay.
 */
export default function Sidebar({ mobile = false, onClose }) {
  const chats = useChatStore((s) => s.chats)
  const order = useChatStore((s) => s.chatOrder)
  const folders = useChatStore((s) => s.folders)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const newChat = useChatStore((s) => s.newChat)
  const setActiveChat = useChatStore((s) => s.setActiveChat)
  const deleteChat = useChatStore((s) => s.deleteChat)
  const renameChat = useChatStore((s) => s.renameChat)
  const togglePin = useChatStore((s) => s.togglePin)
  const moveToFolder = useChatStore((s) => s.moveToFolder)
  const createFolder = useChatStore((s) => s.createFolder)
  const renameFolder = useChatStore((s) => s.renameFolder)
  const deleteFolder = useChatStore((s) => s.deleteFolder)

  const setMemoryOpen = useChatStore((s) => s.setMemoryOpen)
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen)
  const setView = useChatStore((s) => s.setView)
  const view = useChatStore((s) => s.view)

  const [query, setQuery] = useState('')
  const [openFolders, setOpenFolders] = useState({})
  const [menuFor, setMenuFor] = useState(null)

  const orderedChats = useMemo(() => {
    return order.map((id) => chats[id]).filter(Boolean)
  }, [order, chats])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orderedChats
    return orderedChats.filter((c) => {
      if (c.title?.toLowerCase().includes(q)) return true
      return (c.messages || []).some((m) => (m.content || '').toLowerCase().includes(q))
    })
  }, [orderedChats, query])

  const pinned = filtered.filter((c) => c.pinned)
  const byFolder = useMemo(() => {
    const map = {}
    for (const f of folders) map[f.id] = []
    for (const c of filtered) {
      if (c.pinned) continue
      if (c.folderId && map[c.folderId]) map[c.folderId].push(c)
    }
    return map
  }, [folders, filtered])
  const loose = filtered.filter((c) => !c.pinned && !c.folderId)

  const handleNewChat = () => {
    newChat()
    onClose?.()
  }

  const handlePickChat = (id) => {
    setActiveChat(id)
    onClose?.()
  }

  return (
    <aside
      className={`flex h-full flex-col ${
        mobile ? 'glass-strong' : 'glass'
      } border-r hairline`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-3.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl glass-strong shadow-glass">
          <BrandLogo size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <BrandWordmark className="text-[15px] text-white" />
          <div className="text-[10px] uppercase tracking-[0.28em] text-steel-400/80">elite ai os</div>
        </div>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-steel-300 hover:bg-white/[0.05] hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="px-3.5 pt-3">
        <button
          type="button"
          onClick={handleNewChat}
          className="group/new w-full inline-flex items-center justify-between rounded-xl border border-emerald-glow/25 bg-gradient-to-br from-emerald-glow/10 to-cyan-glow/10 px-3 py-2.5 text-sm text-emerald-glow shadow-emerald-soft transition hover:from-emerald-glow/20 hover:to-cyan-glow/20"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={14} />
            <span className="font-medium">New conversation</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-steel-400/70">⌘N</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3.5 pt-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="input-xp pl-9 text-sm"
            style={{ padding: '0.55rem 0.6rem 0.55rem 2rem' }}
          />
        </div>
      </div>

      {/* Lists */}
      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
        {pinned.length > 0 && (
          <Section title="pinned" icon={<Pin size={12} />}>
            {pinned.map((c) => (
              <ChatRow
                key={c.id}
                chat={c}
                active={c.id === activeChatId}
                onPick={() => handlePickChat(c.id)}
                onMenu={() => setMenuFor(menuFor === c.id ? null : c.id)}
                showMenu={menuFor === c.id}
                onClose={() => setMenuFor(null)}
                actions={{
                  rename: () => {
                    const t = window.prompt('Rename chat', c.title)
                    if (t != null) renameChat(c.id, t.trim() || c.title)
                  },
                  togglePin: () => togglePin(c.id),
                  delete: () => {
                    if (confirm('Delete this conversation?')) deleteChat(c.id)
                  },
                  moveToFolder: (fid) => moveToFolder(c.id, fid),
                  folders,
                }}
              />
            ))}
          </Section>
        )}

        {/* Folders */}
        <div className="mt-2 px-1.5">
          <div className="mb-1 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-steel-400/80">
              <Folder size={11} /> folders
            </div>
            <button
              type="button"
              onClick={() => {
                const n = window.prompt('Folder name')
                if (n) createFolder(n)
              }}
              className="grid h-6 w-6 place-items-center rounded-md text-steel-400 hover:bg-white/[0.05] hover:text-white"
              aria-label="New folder"
              title="New folder"
            >
              <FolderPlus size={12} />
            </button>
          </div>
          {folders.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] text-steel-400/70">No folders yet.</div>
          )}
          {folders.map((f) => {
            const open = openFolders[f.id] !== false
            const items = byFolder[f.id] || []
            return (
              <div key={f.id} className="mb-1">
                <div className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-steel-300 hover:bg-white/[0.03]">
                  <button
                    type="button"
                    onClick={() => setOpenFolders((s) => ({ ...s, [f.id]: !open }))}
                    className="grid h-5 w-5 place-items-center rounded text-steel-400 hover:text-white"
                  >
                    {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  <span className="flex-1 truncate font-medium">{f.name}</span>
                  <span className="text-[10px] text-steel-400/70">{items.length}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const n = window.prompt('Rename folder', f.name)
                      if (n) renameFolder(f.id, n)
                    }}
                    className="grid h-5 w-5 place-items-center rounded text-steel-400 hover:text-white"
                    aria-label="Rename folder"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete folder "${f.name}"? Chats will move to All.`)) deleteFolder(f.id)
                    }}
                    className="grid h-5 w-5 place-items-center rounded text-steel-400 hover:text-red-300"
                    aria-label="Delete folder"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden pl-3"
                    >
                      {items.map((c) => (
                        <ChatRow
                          key={c.id}
                          chat={c}
                          active={c.id === activeChatId}
                          onPick={() => handlePickChat(c.id)}
                          onMenu={() => setMenuFor(menuFor === c.id ? null : c.id)}
                          showMenu={menuFor === c.id}
                          onClose={() => setMenuFor(null)}
                          actions={{
                            rename: () => {
                              const t = window.prompt('Rename chat', c.title)
                              if (t != null) renameChat(c.id, t.trim() || c.title)
                            },
                            togglePin: () => togglePin(c.id),
                            delete: () => {
                              if (confirm('Delete this conversation?')) deleteChat(c.id)
                            },
                            moveToFolder: (fid) => moveToFolder(c.id, fid),
                            folders,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Recent */}
        <Section title="recent" icon={<MessageSquare size={12} />} className="mt-2">
          {loose.length === 0 ? (
            <div className="px-2 py-2 text-[12px] text-steel-400/70">
              {query ? 'No matches.' : 'No conversations yet — start a new one.'}
            </div>
          ) : (
            loose.map((c) => (
              <ChatRow
                key={c.id}
                chat={c}
                active={c.id === activeChatId}
                onPick={() => handlePickChat(c.id)}
                onMenu={() => setMenuFor(menuFor === c.id ? null : c.id)}
                showMenu={menuFor === c.id}
                onClose={() => setMenuFor(null)}
                actions={{
                  rename: () => {
                    const t = window.prompt('Rename chat', c.title)
                    if (t != null) renameChat(c.id, t.trim() || c.title)
                  },
                  togglePin: () => togglePin(c.id),
                  delete: () => {
                    if (confirm('Delete this conversation?')) deleteChat(c.id)
                  },
                  moveToFolder: (fid) => moveToFolder(c.id, fid),
                  folders,
                }}
              />
            ))
          )}
        </Section>
      </div>

      {/* Footer actions */}
      <div className="border-t hairline px-2 py-2 safe-bottom">
        <div className="grid grid-cols-2 gap-1.5 px-1">
          <FooterAction
            active={view === 'codex'}
            icon={<Code2 size={14} />}
            label="Codex"
            onClick={() => { setView('codex'); onClose?.() }}
          />
          <FooterAction
            icon={<Brain size={14} />}
            label="Memory"
            onClick={() => { setMemoryOpen(true); onClose?.() }}
          />
          <FooterAction
            icon={<Cpu size={14} />}
            label="Models"
            onClick={() => { useChatStore.getState().setModelPickerOpen(true); onClose?.() }}
          />
          <FooterAction
            icon={<Settings size={14} />}
            label="Settings"
            onClick={() => { setSettingsOpen(true); onClose?.() }}
          />
        </div>

        <DonationCard />
      </div>
    </aside>
  )
}

function DonationCard() {
  const [copied, setCopied] = useState(false)
  const number = '09482887486'
  const onCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(number)
      else {
        const ta = document.createElement('textarea')
        ta.value = number
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }
  return (
    <div className="mx-1 mt-2 rounded-xl border border-emerald-glow/20 bg-gradient-to-br from-emerald-glow/[0.06] to-cyan-glow/[0.04] p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-steel-300">
        <Heart size={10} className="text-emerald-glow" />
        <span>support the creator</span>
      </div>
      <p className="text-[11.5px] leading-snug text-steel-400">
        Enjoying XPremChatbot? Donate <span className="text-emerald-glow">kahit barya</span> via GCash.
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="mt-1.5 flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[11px] transition hover:border-white/[0.18]"
      >
        <span className="font-mono text-steel-100">{number}</span>
        <span className="inline-flex items-center gap-1 text-steel-300">
          {copied ? <Check size={11} className="text-emerald-glow" /> : <Copy size={11} />}
          {copied ? 'copied' : 'copy'}
        </span>
      </button>
    </div>
  )
}

function Section({ title, icon, className = '', children }) {
  return (
    <div className={`px-1.5 ${className}`}>
      <div className="mb-1 flex items-center gap-1.5 px-2 text-[10px] uppercase tracking-[0.22em] text-steel-400/80">
        {icon}
        <span>{title}</span>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function ChatRow({ chat, active, onPick, onMenu, showMenu, onClose, actions }) {
  return (
    <div className="group/row relative">
      <button
        type="button"
        onClick={onPick}
        className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition ${
          active
            ? 'bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
            : 'text-steel-300 hover:bg-white/[0.035] hover:text-steel-100'
        }`}
      >
        <span
          className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
            active ? 'bg-emerald-glow' : 'bg-steel-400/40'
          }`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px]">{chat.title || 'Untitled'}</span>
          <span className="block truncate text-[11px] text-steel-400/80">
            {relativeTime(chat.updatedAt)} · {chat.messages?.length || 0} messages
          </span>
        </span>
        {chat.pinned && <Pin size={11} className="mt-1.5 text-emerald-glow/80" />}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onMenu?.() }}
        className="absolute right-1 top-1.5 hidden h-7 w-7 place-items-center rounded-md text-steel-400 hover:bg-white/[0.06] hover:text-white group-hover/row:grid"
        aria-label="More actions"
      >
        <MoreHorizontal size={14} />
      </button>

      {showMenu && (
        <RowMenu chat={chat} actions={actions} onClose={onClose} />
      )}
    </div>
  )
}

function RowMenu({ chat, actions, onClose }) {
  return (
    <>
      <button className="fixed inset-0 z-30 cursor-default" onClick={onClose} aria-hidden tabIndex={-1} />
      <div className="absolute right-1 top-9 z-40 w-52 rounded-xl glass-strong p-1 shadow-glass-lg">
        <MenuItem
          icon={chat.pinned ? <PinOff size={12} /> : <Pin size={12} />}
          label={chat.pinned ? 'Unpin' : 'Pin'}
          onClick={() => { actions.togglePin(); onClose() }}
        />
        <MenuItem icon={<Pencil size={12} />} label="Rename" onClick={() => { actions.rename(); onClose() }} />
        <div className="my-1 border-t hairline" />
        <div className="px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-steel-400/80">move to folder</div>
        <MenuItem
          icon={<Folder size={12} />}
          label="No folder"
          onClick={() => { actions.moveToFolder(null); onClose() }}
        />
        {(actions.folders || []).map((f) => (
          <MenuItem
            key={f.id}
            icon={<Folder size={12} />}
            label={f.name}
            onClick={() => { actions.moveToFolder(f.id); onClose() }}
          />
        ))}
        <div className="my-1 border-t hairline" />
        <MenuItem
          icon={<Trash2 size={12} />}
          label="Delete"
          danger
          onClick={() => { actions.delete(); onClose() }}
        />
      </div>
    </>
  )
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] ${
        danger ? 'text-red-300 hover:bg-red-400/10' : 'text-steel-200 hover:bg-white/[0.05]'
      }`}
    >
      <span className="opacity-80">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

function FooterAction({ icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/fa inline-flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-[12px] transition ${
        active
          ? 'border-emerald-glow/30 bg-emerald-glow/10 text-emerald-glow'
          : 'border-white/[0.06] bg-white/[0.02] text-steel-300 hover:border-white/[0.12] hover:text-steel-100'
      }`}
    >
      <span className="opacity-90">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
