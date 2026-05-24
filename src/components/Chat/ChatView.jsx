import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { buildMessages, completeOnce, streamChat, findModel } from '../../lib/puter'
import Message from './Message'
import Composer from './Composer'
import EmptyState from './EmptyState'
import TypingIndicator from './TypingIndicator'
import { useToast } from '../UI/Toast'

/**
 * The streaming chat surface. Owns:
 *  - send / stream / abort
 *  - regenerate / continue / edit / delete
 *  - smart auto-scroll
 *  - AI-generated titles
 */
export default function ChatView({ onPickModel }) {
  const toast = useToast()
  const activeId = useChatStore((s) => s.activeChatId)
  const chats = useChatStore((s) => s.chats)
  const newChat = useChatStore((s) => s.newChat)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const deleteMessage = useChatStore((s) => s.deleteMessage)
  const truncateAfter = useChatStore((s) => s.truncateAfter)
  const truncateBefore = useChatStore((s) => s.truncateBefore)
  const renameChat = useChatStore((s) => s.renameChat)

  const memory = useChatStore((s) => s.memory)
  const systemPrompt = useChatStore((s) => s.systemPrompt)
  const defaultModel = useChatStore((s) => s.defaultModel)
  const autoTitle = useChatStore((s) => s.autoTitle)

  const chat = activeId ? chats[activeId] : null
  const messages = chat?.messages || []
  const modelId = chat?.model || defaultModel
  const model = findModel(modelId)

  const [streamingId, setStreamingId] = useState(null)
  const abortRef = useRef(null)
  const scrollerRef = useRef(null)
  const [stickToBottom, setStickToBottom] = useState(true)

  // Track scroll position for the "jump to latest" pill
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight
      setStickToBottom(dist < 80)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [activeId])

  // Auto-scroll while streaming, only if user hasn't scrolled away
  useEffect(() => {
    if (!stickToBottom) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, stickToBottom, streamingId])

  const ensureChat = () => {
    let id = activeId
    if (!id) id = newChat()
    return id
  }

  const runStream = async (chatId, opts = {}) => {
    const { continueAssistantId } = opts
    const state = useChatStore.getState()
    const c = state.chats[chatId]
    if (!c) return

    let assistantId = continueAssistantId
    let baseMessages = c.messages

    if (!assistantId) {
      assistantId = addMessage(chatId, {
        role: 'assistant',
        content: '',
        model: modelId,
        streaming: true,
      })
    } else {
      updateMessage(chatId, assistantId, { streaming: true, error: null })
      // Exclude the placeholder from prompt build
      baseMessages = c.messages.filter((m) => m.id !== assistantId)
    }
    setStreamingId(assistantId)

    const controller = new AbortController()
    abortRef.current = controller

    const finalMessages = buildMessages({
      messages: baseMessages,
      systemPrompt,
      memory,
    })

    if (continueAssistantId) {
      // Ask the model to continue from its prior assistant text
      const prior = c.messages.find((m) => m.id === continueAssistantId)
      if (prior?.content) {
        finalMessages.push({
          role: 'assistant',
          content: prior.content,
        })
        finalMessages.push({
          role: 'user',
          content: 'Continue your previous answer from exactly where you left off. Do not repeat content.',
        })
      }
    }

    try {
      const startContent = continueAssistantId
        ? c.messages.find((m) => m.id === continueAssistantId)?.content || ''
        : ''
      let acc = startContent
      const { aborted } = await streamChat({
        messages: finalMessages,
        model: modelId,
        signal: controller.signal,
        onDelta: (_d, full) => {
          // For continue: append delta to original content
          const nextContent = continueAssistantId ? startContent + full : full
          acc = nextContent
          updateMessage(chatId, assistantId, { content: nextContent })
        },
      })
      updateMessage(chatId, assistantId, { streaming: false, content: acc })
      if (aborted) toast.push('generation stopped', { kind: 'info' })

      // Auto-title the very first turn
      if (autoTitle && c.title === 'New conversation' && !continueAssistantId) {
        maybeAutoTitle(chatId).catch(() => {})
      }
    } catch (err) {
      console.error(err)
      updateMessage(chatId, assistantId, {
        streaming: false,
        error: err?.message || 'Generation failed. Check your network and try again.',
      })
      toast.push('generation failed', { kind: 'error' })
    } finally {
      setStreamingId(null)
      abortRef.current = null
    }
  }

  const maybeAutoTitle = async (chatId) => {
    const c = useChatStore.getState().chats[chatId]
    if (!c) return
    const firstUser = c.messages.find((m) => m.role === 'user')
    const firstAsst = c.messages.find((m) => m.role === 'assistant')
    if (!firstUser) return
    const prompt = [
      { role: 'system', content: 'You generate concise chat titles. Reply with only a 3-6 word title, no punctuation, no quotes.' },
      { role: 'user', content: `User: ${(firstUser.content || '').slice(0, 600)}\n\nAssistant: ${(firstAsst?.content || '').slice(0, 600)}\n\nTitle:` },
    ]
    const t = await completeOnce({ messages: prompt, model: modelId })
    const cleaned = String(t || '').replace(/["'`*_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
    if (cleaned) renameChat(chatId, cleaned)
  }

  const onSend = ({ content, images, attachments }) => {
    const id = ensureChat()
    addMessage(id, { role: 'user', content, images, attachments })
    runStream(id)
  }

  const onStop = () => {
    abortRef.current?.abort()
  }

  const onRegenerate = (msg) => {
    if (!chat) return
    truncateBefore(chat.id, msg.id)
    runStream(chat.id)
  }

  const onContinue = (msg) => {
    if (!chat) return
    runStream(chat.id, { continueAssistantId: msg.id })
  }

  const onEdit = (msg) => {
    if (!chat) return
    const newText = window.prompt('Edit message', msg.content || '')
    if (newText == null) return
    truncateAfter(chat.id, msg.id)
    updateMessage(chat.id, msg.id, { content: newText })
    runStream(chat.id)
  }

  const onDelete = (msg) => {
    if (!chat) return
    deleteMessage(chat.id, msg.id)
  }

  const onSuggest = (text) => {
    onSend({ content: text, images: [], attachments: [] })
  }

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== 'system'),
    [messages]
  )

  const isStreaming = !!streamingId

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 pt-3 sm:px-6 sm:pt-6"
      >
        {visibleMessages.length === 0 ? (
          <EmptyState onSuggest={onSuggest} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {visibleMessages.map((m, idx) => (
              <Message
                key={m.id}
                msg={m}
                isLast={idx === visibleMessages.length - 1}
                isStreaming={streamingId === m.id}
                onCopy={() => {}}
                onRegenerate={() => onRegenerate(m)}
                onContinue={() => onContinue(m)}
                onEdit={() => onEdit(m)}
                onDelete={() => onDelete(m)}
                onStop={onStop}
              />
            ))}

            {isStreaming &&
              !visibleMessages.some((m) => m.id === streamingId && (m.content || '').length > 0) && (
                <TypingIndicator label={`thinking · ${model.label}`} />
              )}
          </div>
        )}
      </div>

      {/* Jump-to-latest pill */}
      {!stickToBottom && visibleMessages.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const el = scrollerRef.current
            if (el) el.scrollTop = el.scrollHeight
          }}
          className="absolute left-1/2 bottom-[120px] -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full glass-strong px-3 py-1.5 text-xs text-steel-200 shadow-glass-lg hover:text-white"
        >
          <ChevronDown size={14} /> latest
        </button>
      )}

      <div className="mx-auto w-full max-w-3xl px-3 pb-3 sm:px-6 safe-bottom">
        <Composer
          onSend={onSend}
          isStreaming={isStreaming}
          onStop={onStop}
          onPickModel={onPickModel}
        />
      </div>
    </div>
  )
}
