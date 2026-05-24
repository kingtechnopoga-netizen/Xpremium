import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CinematicBackground from './components/Background/CinematicBackground'
import BootSequence from './components/Splash/BootSequence'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import BottomNav from './components/Layout/BottomNav'
import ChatView from './components/Chat/ChatView'
import CodexWorkspace from './components/Codex/CodexWorkspace'
import SettingsPanel from './components/Settings/SettingsPanel'
import MemoryManager from './components/Memory/MemoryManager'
import ModelSelector from './components/Settings/ModelSelector'
import DonationFooter, { MobileDonationStrip } from './components/Footer/DonationFooter'
import { ToastProvider } from './components/UI/Toast'
import { useChatStore } from './store/chatStore'
import { ensurePuterScript } from './lib/puter'

export default function App() {
  const [booting, setBooting] = useState(true)

  // UI state
  const view = useChatStore((s) => s.view)
  const sidebarOpen = useChatStore((s) => s.sidebarOpen)
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen)

  const settingsOpen = useChatStore((s) => s.settingsOpen)
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen)
  const memoryOpen = useChatStore((s) => s.memoryOpen)
  const setMemoryOpen = useChatStore((s) => s.setMemoryOpen)
  const modelPickerOpen = useChatStore((s) => s.modelPickerOpen)
  const setModelPickerOpen = useChatStore((s) => s.setModelPickerOpen)

  const newChat = useChatStore((s) => s.newChat)
  const activeChatId = useChatStore((s) => s.activeChatId)

  // Defensive: ensure puter.js script exists even if HTML fails to load it
  useEffect(() => { ensurePuterScript() }, [])

  // First-run: if there is no active chat, create one ready to receive a message
  useEffect(() => {
    if (!activeChatId) newChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Global shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'n') { e.preventDefault(); newChat() }
      if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); setModelPickerOpen(true) }
      if (meta && e.key === ',') { e.preventDefault(); setSettingsOpen(true) }
      if (meta && e.key.toLowerCase() === 'b') { e.preventDefault(); setSidebarOpen(!sidebarOpen) }
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen, newChat, setModelPickerOpen, setSettingsOpen, setSidebarOpen])

  return (
    <ToastProvider>
      {/* Background layer */}
      <CinematicBackground />

      {/* Splash boot screen */}
      {booting && <BootSequence onDone={() => setBooting(false)} />}

      {/* App shell */}
      <div className="relative flex h-full min-h-0 w-full overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-[300px] md:shrink-0">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="mobile-sidebar"
              className="fixed inset-0 z-[100] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button
                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute inset-y-0 left-0 w-[86vw] max-w-[320px]"
              >
                <Sidebar mobile onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-full min-h-0 flex-1 flex-col">
          <TopBar onPickModel={() => setModelPickerOpen(true)} />

          <main className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {view === 'chat' ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  <ChatView onPickModel={() => setModelPickerOpen(true)} />
                </motion.div>
              ) : (
                <motion.div
                  key="codex"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  <CodexWorkspace />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <MobileDonationStrip />
          <BottomNav onPickModel={() => setModelPickerOpen(true)} />
        </div>
      </div>

      {/* Floating desktop donation card */}
      <DonationFooter />

      {/* Modals */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MemoryManager open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      <ModelSelector open={modelPickerOpen} onClose={() => setModelPickerOpen(false)} />
    </ToastProvider>
  )
}
