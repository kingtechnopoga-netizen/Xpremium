// puter.js integration layer
// Provides a stable async surface around puter.ai with graceful fallbacks.
//
// We intentionally avoid throwing for unsupported features — the app must keep
// working even when running offline or before the puter.js script has loaded.

const PUTER_SCRIPT = 'https://js.puter.com/v2/'

let readyPromise = null

/** Wait for the global `puter` object to exist (script loads with `defer`). */
export function waitForPuter(timeoutMs = 8000) {
  if (readyPromise) return readyPromise
  readyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)
    if (window.puter) return resolve(window.puter)
    const start = Date.now()
    const tick = () => {
      if (window.puter) return resolve(window.puter)
      if (Date.now() - start > timeoutMs) return resolve(null)
      setTimeout(tick, 80)
    }
    tick()
  })
  return readyPromise
}

/** Inject the puter.js script if it's missing (defensive — index.html already loads it). */
export function ensurePuterScript() {
  if (typeof window === 'undefined') return
  if (window.puter) return
  if (document.querySelector(`script[src="${PUTER_SCRIPT}"]`)) return
  const s = document.createElement('script')
  s.src = PUTER_SCRIPT
  s.defer = true
  document.head.appendChild(s)
}

/**
 * Curated catalog of models exposed via puter.js.
 * Order matters — first entries appear at the top of the model picker.
 */
export const MODELS = [
  { id: 'gpt-5-nano', label: 'GPT-5 Nano', vendor: 'OpenAI', tier: 'fast', tags: ['fast', 'default'] },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', vendor: 'OpenAI', tier: 'balanced', tags: ['balanced'] },
  { id: 'gpt-5', label: 'GPT-5', vendor: 'OpenAI', tier: 'flagship', tags: ['flagship', 'reasoning'] },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', vendor: 'OpenAI', tier: 'fast', tags: ['fast'] },
  { id: 'gpt-4o', label: 'GPT-4o', vendor: 'OpenAI', tier: 'balanced', tags: ['vision'] },
  { id: 'claude-sonnet-4', label: 'Claude Sonnet 4', vendor: 'Anthropic', tier: 'flagship', tags: ['flagship'] },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', vendor: 'Anthropic', tier: 'balanced', tags: ['coding'] },
  { id: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', vendor: 'Google', tier: 'fast', tags: ['fast', 'vision'] },
  { id: 'google/gemini-1.5-flash', label: 'Gemini 1.5 Flash', vendor: 'Google', tier: 'fast', tags: ['fast'] },
  { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', vendor: 'Meta', tier: 'fast', tags: ['open'] },
  { id: 'mistral-large-latest', label: 'Mistral Large', vendor: 'Mistral', tier: 'balanced', tags: ['balanced'] },
  { id: 'deepseek-chat', label: 'DeepSeek Chat', vendor: 'DeepSeek', tier: 'balanced', tags: ['coding'] },
  { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', vendor: 'DeepSeek', tier: 'flagship', tags: ['reasoning'] },
  { id: 'grok-beta', label: 'Grok Beta', vendor: 'xAI', tier: 'balanced', tags: ['balanced'] },
]

export function findModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0]
}

/**
 * Build the message array sent to puter.ai.chat.
 * - Includes a system prompt
 * - Optionally injects a memory block
 * - Filters internal/UI-only fields
 */
export function buildMessages({ messages, systemPrompt, memory }) {
  const out = []
  const sys = [systemPrompt?.trim()]
  if (memory && memory.trim()) {
    sys.push(`\n\n[Persistent memory — facts the user wants you to remember]\n${memory.trim()}`)
  }
  const sysJoined = sys.filter(Boolean).join('')
  if (sysJoined) out.push({ role: 'system', content: sysJoined })

  for (const m of messages) {
    if (!m || m.role === 'system') continue
    if (m.error) continue
    const content = (m.content || '').toString()
    if (!content && !m.images?.length) continue
    if (m.images?.length && m.role === 'user') {
      // Multimodal content array (OpenAI-style); puter.js accepts this for vision models
      const parts = []
      if (content) parts.push({ type: 'text', text: content })
      for (const img of m.images) parts.push({ type: 'image_url', image_url: { url: img } })
      out.push({ role: 'user', content: parts })
    } else {
      out.push({ role: m.role, content })
    }
  }
  return out
}

/**
 * Stream a chat completion via puter.ai.
 *
 * @param {Object} opts
 * @param {Array}  opts.messages      Final messages array (already includes system).
 * @param {string} opts.model         Model id.
 * @param {AbortSignal} opts.signal   Optional abort signal.
 * @param {(delta:string,full:string)=>void} opts.onDelta  Called for each chunk.
 * @returns {Promise<{ text: string, aborted: boolean }>}
 */
export async function streamChat({ messages, model, signal, onDelta }) {
  const puter = await waitForPuter()
  if (!puter || !puter.ai || typeof puter.ai.chat !== 'function') {
    return fallbackEcho({ messages, signal, onDelta })
  }

  let full = ''
  let aborted = false
  const onAbort = () => { aborted = true }
  signal?.addEventListener('abort', onAbort)

  try {
    const response = await puter.ai.chat(messages, { model, stream: true })

    // Async iterable streaming
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      for await (const part of response) {
        if (aborted) break
        const delta = extractDelta(part)
        if (delta) {
          full += delta
          onDelta?.(delta, full)
        }
      }
    } else if (typeof response === 'string') {
      full = response
      onDelta?.(response, full)
    } else if (response?.message?.content) {
      full = textFrom(response.message.content)
      onDelta?.(full, full)
    } else if (response?.text) {
      full = response.text
      onDelta?.(full, full)
    }
  } catch (err) {
    if (aborted) return { text: full, aborted: true }
    throw err
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }

  return { text: full, aborted }
}

/** Extract a text delta from any of puter.js's streaming chunk shapes. */
function extractDelta(part) {
  if (part == null) return ''
  if (typeof part === 'string') return part
  if (typeof part.text === 'string') return part.text
  if (part?.delta?.content) return textFrom(part.delta.content)
  if (part?.choices?.[0]?.delta?.content) return textFrom(part.choices[0].delta.content)
  if (part?.message?.content) return textFrom(part.message.content)
  if (part?.content) return textFrom(part.content)
  return ''
}

function textFrom(content) {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map((c) => (typeof c === 'string' ? c : c?.text || '')).join('')
  }
  return ''
}

/** Non-streaming completion — used for AI-generated titles / summaries. */
export async function completeOnce({ messages, model }) {
  const puter = await waitForPuter()
  if (!puter || !puter.ai?.chat) {
    const last = messages[messages.length - 1]?.content || ''
    return typeof last === 'string' ? last.slice(0, 80) : 'Untitled chat'
  }
  try {
    const r = await puter.ai.chat(messages, { model })
    if (typeof r === 'string') return r
    if (r?.message?.content) return textFrom(r.message.content)
    if (r?.text) return r.text
    return ''
  } catch {
    return ''
  }
}

/**
 * Local-only fallback when puter.js cannot be reached.
 * Returns an apologetic message so the UI never feels broken.
 */
async function fallbackEcho({ messages, signal, onDelta }) {
  const last = messages[messages.length - 1]
  const userText = typeof last?.content === 'string'
    ? last.content
    : Array.isArray(last?.content)
      ? last.content.map((c) => c?.text || '').join(' ')
      : ''

  const reply =
    `**Offline runtime** — the puter.js AI bridge isn't reachable right now.\n\n` +
    `I caught your message:\n\n> ${userText.slice(0, 280) || '(empty)'}\n\n` +
    `Reconnect to the network and try again, or open Settings to switch models.`
  let full = ''
  for (const ch of reply) {
    if (signal?.aborted) break
    full += ch
    onDelta?.(ch, full)
    await new Promise((r) => setTimeout(r, 6))
  }
  return { text: full, aborted: !!signal?.aborted }
}
