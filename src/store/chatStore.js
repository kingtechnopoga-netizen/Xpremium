import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { uid } from '../lib/utils'
import { findModel } from '../lib/puter'

const DEFAULT_SYSTEM_PROMPT = `You are XPremChatbot, an elite AI operating system designed for hackers, AI engineers, and advanced developers.

- Be precise, technical, and confident.
- Prefer structured answers with code examples when relevant.
- Use Markdown: headings, bullet lists, fenced code blocks with language tags.
- For code, default to clean, production-quality patterns.
- Be concise unless depth is requested.
- Never invent APIs; if unsure, say so and suggest how to verify.`

const initialChat = () => ({
  id: uid('chat'),
  title: 'New conversation',
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pinned: false,
  folderId: null,
  model: null, // null => use global default
})

export const useChatStore = create(
  persist(
    (set, get) => ({
      // ---------- Data ----------
      chats: {},
      chatOrder: [], // most recent first
      activeChatId: null,
      folders: [],   // [{ id, name }]
      memory: '',    // user-curated persistent facts

      // ---------- Settings ----------
      defaultModel: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_MODEL) || 'gpt-5-nano',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      streaming: true,
      theme: 'stealth', // 'stealth' | 'graphite' | 'midnight'
      density: 'comfortable', // 'comfortable' | 'compact'
      sendOnEnter: true,
      autoTitle: true,
      bgIntensity: 'normal', // 'minimal' | 'normal' | 'cinematic'

      // ---------- UI flags (not persisted via partialize, but harmless) ----------
      sidebarOpen: false,
      settingsOpen: false,
      memoryOpen: false,
      modelPickerOpen: false,
      view: 'chat', // 'chat' | 'codex'

      // ---------- Selectors ----------
      getActiveChat: () => {
        const s = get()
        return s.activeChatId ? s.chats[s.activeChatId] : null
      },
      getActiveModel: () => {
        const s = get()
        const c = s.activeChatId ? s.chats[s.activeChatId] : null
        return findModel(c?.model || s.defaultModel)
      },

      // ---------- Chat lifecycle ----------
      newChat: ({ folderId = null } = {}) => {
        const c = { ...initialChat(), folderId }
        set((s) => ({
          chats: { ...s.chats, [c.id]: c },
          chatOrder: [c.id, ...s.chatOrder],
          activeChatId: c.id,
          sidebarOpen: false,
          view: 'chat',
        }))
        return c.id
      },

      setActiveChat: (id) =>
        set((s) => ({ activeChatId: id, sidebarOpen: false, view: 'chat' })),

      deleteChat: (id) =>
        set((s) => {
          const next = { ...s.chats }
          delete next[id]
          const order = s.chatOrder.filter((x) => x !== id)
          let active = s.activeChatId
          if (active === id) active = order[0] || null
          return { chats: next, chatOrder: order, activeChatId: active }
        }),

      renameChat: (id, title) =>
        set((s) => {
          const c = s.chats[id]
          if (!c) return {}
          return { chats: { ...s.chats, [id]: { ...c, title, updatedAt: Date.now() } } }
        }),

      togglePin: (id) =>
        set((s) => {
          const c = s.chats[id]
          if (!c) return {}
          return { chats: { ...s.chats, [id]: { ...c, pinned: !c.pinned } } }
        }),

      moveToFolder: (id, folderId) =>
        set((s) => {
          const c = s.chats[id]
          if (!c) return {}
          return { chats: { ...s.chats, [id]: { ...c, folderId } } }
        }),

      setChatModel: (id, modelId) =>
        set((s) => {
          const c = s.chats[id]
          if (!c) return {}
          return { chats: { ...s.chats, [id]: { ...c, model: modelId } } }
        }),

      // ---------- Folders ----------
      createFolder: (name) => {
        const f = { id: uid('fld'), name: name?.trim() || 'New folder' }
        set((s) => ({ folders: [...s.folders, f] }))
        return f.id
      },
      renameFolder: (id, name) =>
        set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),
      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          chats: Object.fromEntries(
            Object.entries(s.chats).map(([k, c]) => [k, c.folderId === id ? { ...c, folderId: null } : c])
          ),
        })),

      // ---------- Messages ----------
      addMessage: (chatId, msg) => {
        const id = uid('msg')
        const m = { id, createdAt: Date.now(), ...msg }
        set((s) => {
          const c = s.chats[chatId]
          if (!c) return {}
          const next = { ...c, messages: [...c.messages, m], updatedAt: Date.now() }
          const order = [chatId, ...s.chatOrder.filter((x) => x !== chatId)]
          return { chats: { ...s.chats, [chatId]: next }, chatOrder: order }
        })
        return id
      },

      updateMessage: (chatId, msgId, patch) =>
        set((s) => {
          const c = s.chats[chatId]
          if (!c) return {}
          const messages = c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m))
          return { chats: { ...s.chats, [chatId]: { ...c, messages, updatedAt: Date.now() } } }
        }),

      deleteMessage: (chatId, msgId) =>
        set((s) => {
          const c = s.chats[chatId]
          if (!c) return {}
          const messages = c.messages.filter((m) => m.id !== msgId)
          return { chats: { ...s.chats, [chatId]: { ...c, messages, updatedAt: Date.now() } } }
        }),

      truncateAfter: (chatId, msgId) =>
        set((s) => {
          const c = s.chats[chatId]
          if (!c) return {}
          const idx = c.messages.findIndex((m) => m.id === msgId)
          if (idx < 0) return {}
          const messages = c.messages.slice(0, idx + 1)
          return { chats: { ...s.chats, [chatId]: { ...c, messages, updatedAt: Date.now() } } }
        }),

      truncateBefore: (chatId, msgId) =>
        set((s) => {
          const c = s.chats[chatId]
          if (!c) return {}
          const idx = c.messages.findIndex((m) => m.id === msgId)
          if (idx < 0) return {}
          const messages = c.messages.slice(0, idx)
          return { chats: { ...s.chats, [chatId]: { ...c, messages, updatedAt: Date.now() } } }
        }),

      // ---------- Memory & settings ----------
      setMemory: (text) => set({ memory: text }),
      setSystemPrompt: (text) => set({ systemPrompt: text }),
      setDefaultModel: (id) => set({ defaultModel: id }),
      setStreaming: (v) => set({ streaming: !!v }),
      setTheme: (t) => set({ theme: t }),
      setDensity: (d) => set({ density: d }),
      setSendOnEnter: (v) => set({ sendOnEnter: !!v }),
      setAutoTitle: (v) => set({ autoTitle: !!v }),
      setBgIntensity: (v) => set({ bgIntensity: v }),

      // ---------- UI ----------
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (v) => set({ sidebarOpen: !!v }),
      setSettingsOpen: (v) => set({ settingsOpen: !!v }),
      setMemoryOpen: (v) => set({ memoryOpen: !!v }),
      setModelPickerOpen: (v) => set({ modelPickerOpen: !!v }),
      setView: (v) => set({ view: v }),

      // ---------- Bulk import/export ----------
      exportAll: () => {
        const s = get()
        return {
          version: 1,
          exportedAt: Date.now(),
          chats: s.chats,
          chatOrder: s.chatOrder,
          folders: s.folders,
          memory: s.memory,
          systemPrompt: s.systemPrompt,
          defaultModel: s.defaultModel,
        }
      },
      importAll: (payload) => {
        if (!payload || typeof payload !== 'object') return false
        set((s) => ({
          chats: { ...s.chats, ...(payload.chats || {}) },
          chatOrder: Array.from(new Set([...(payload.chatOrder || []), ...s.chatOrder])),
          folders: [...(payload.folders || []), ...s.folders],
          memory: payload.memory ?? s.memory,
          systemPrompt: payload.systemPrompt ?? s.systemPrompt,
          defaultModel: payload.defaultModel ?? s.defaultModel,
        }))
        return true
      },
      wipeAll: () =>
        set({
          chats: {},
          chatOrder: [],
          activeChatId: null,
          folders: [],
          memory: '',
        }),
    }),
    {
      name: 'xprem-chat-store-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        chats: s.chats,
        chatOrder: s.chatOrder,
        activeChatId: s.activeChatId,
        folders: s.folders,
        memory: s.memory,
        defaultModel: s.defaultModel,
        systemPrompt: s.systemPrompt,
        streaming: s.streaming,
        theme: s.theme,
        density: s.density,
        sendOnEnter: s.sendOnEnter,
        autoTitle: s.autoTitle,
        bgIntensity: s.bgIntensity,
      }),
    }
  )
)

export { DEFAULT_SYSTEM_PROMPT }
