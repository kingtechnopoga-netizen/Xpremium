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
 * Curated, validated catalog of models exposed via puter.js.
 *
 * Every id in this list was scraped from developer.puter.com's per-vendor
 * model pages and verified to exist in the puter.js model registry as of
 * the time of writing. The list is intentionally curated (≈25 models) —
 * not exhaustive — so the picker stays fast and useful on mobile.
 *
 * If you add a new id here, also keep MODEL_ALIASES below in sync if the
 * old id is still in user localStorage from a previous release.
 */
export const MODELS = [
  // ── OpenAI ──────────────────────────────────────────────────────────
  { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', vendor: 'OpenAI', tier: 'fast', tags: ['fast', 'default'] },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', vendor: 'OpenAI', tier: 'fast', tags: ['fast'] },
  { id: 'gpt-4.1', label: 'GPT-4.1', vendor: 'OpenAI', tier: 'balanced', tags: ['balanced'] },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', vendor: 'OpenAI', tier: 'fast', tags: ['fast', 'vision'] },
  { id: 'gpt-4o', label: 'GPT-4o', vendor: 'OpenAI', tier: 'balanced', tags: ['vision'] },
  { id: 'gpt-5', label: 'GPT-5', vendor: 'OpenAI', tier: 'flagship', tags: ['flagship'] },
  { id: 'gpt-5.1', label: 'GPT-5.1', vendor: 'OpenAI', tier: 'flagship', tags: ['flagship', 'reasoning'] },
  { id: 'gpt-5.1-codex', label: 'GPT-5.1 Codex', vendor: 'OpenAI', tier: 'flagship', tags: ['coding'] },

  // ── Anthropic / Claude ──────────────────────────────────────────────
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', vendor: 'Anthropic', tier: 'fast', tags: ['fast'] },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', vendor: 'Anthropic', tier: 'balanced', tags: ['coding'] },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', vendor: 'Anthropic', tier: 'balanced', tags: ['balanced'] },
  { id: 'claude-opus-4-1', label: 'Claude Opus 4.1', vendor: 'Anthropic', tier: 'flagship', tags: ['flagship'] },
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5', vendor: 'Anthropic', tier: 'flagship', tags: ['flagship', 'reasoning'] },

  // ── Google / Gemini ─────────────────────────────────────────────────
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', vendor: 'Google', tier: 'fast', tags: ['fast'] },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', vendor: 'Google', tier: 'fast', tags: ['fast', 'vision'] },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', vendor: 'Google', tier: 'flagship', tags: ['flagship', 'reasoning'] },

  // ── DeepSeek (V4 added per request) ─────────────────────────────────
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', vendor: 'DeepSeek', tier: 'fast', tags: ['fast', 'new'] },
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro', vendor: 'DeepSeek', tier: 'flagship', tags: ['flagship', 'new'] },
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', vendor: 'DeepSeek', tier: 'balanced', tags: ['balanced', 'coding'] },
  { id: 'deepseek/deepseek-chat-v3.1', label: 'DeepSeek Chat V3.1', vendor: 'DeepSeek', tier: 'balanced', tags: ['coding'] },
  { id: 'deepseek/deepseek-r1-0528', label: 'DeepSeek R1', vendor: 'DeepSeek', tier: 'flagship', tags: ['reasoning'] },

  // ── Meta / Llama ────────────────────────────────────────────────────
  { id: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout', vendor: 'Meta', tier: 'fast', tags: ['fast', 'open'] },
  { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick', vendor: 'Meta', tier: 'flagship', tags: ['flagship', 'open'] },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', vendor: 'Meta', tier: 'balanced', tags: ['balanced', 'open'] },

  // ── Mistral ─────────────────────────────────────────────────────────
  { id: 'mistralai/ministral-8b', label: 'Ministral 8B', vendor: 'Mistral', tier: 'fast', tags: ['fast'] },
  { id: 'mistralai/mistral-large-2411', label: 'Mistral Large', vendor: 'Mistral', tier: 'flagship', tags: ['flagship'] },
  { id: 'mistralai/codestral-2508', label: 'Codestral', vendor: 'Mistral', tier: 'balanced', tags: ['coding'] },

  // ── xAI / Grok ──────────────────────────────────────────────────────
  { id: 'x-ai/grok-3-mini', label: 'Grok 3 Mini', vendor: 'xAI', tier: 'fast', tags: ['fast'] },
  { id: 'x-ai/grok-3', label: 'Grok 3', vendor: 'xAI', tier: 'balanced', tags: ['balanced'] },
  { id: 'x-ai/grok-4-0709', label: 'Grok 4', vendor: 'xAI', tier: 'flagship', tags: ['flagship'] },

  // ── Alibaba / Qwen ──────────────────────────────────────────────────
  { id: 'qwen/qwen3-30b-a3b-instruct-2507', label: 'Qwen3 30B', vendor: 'Qwen', tier: 'balanced', tags: ['balanced', 'open'] },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B', vendor: 'Qwen', tier: 'balanced', tags: ['coding', 'open'] },
  { id: 'qwen/qwen3-235b-a22b-thinking-2507', label: 'Qwen3 235B Thinking', vendor: 'Qwen', tier: 'flagship', tags: ['reasoning', 'open'] },

  // ── Moonshot / Kimi ─────────────────────────────────────────────────
  { id: 'moonshotai/kimi-k2', label: 'Kimi K2', vendor: 'Moonshot', tier: 'balanced', tags: ['balanced'] },
  { id: 'moonshotai/kimi-k2-thinking', label: 'Kimi K2 Thinking', vendor: 'Moonshot', tier: 'flagship', tags: ['reasoning'] },

  // ── Z.AI / GLM ──────────────────────────────────────────────────────
  { id: 'z-ai/glm-4.6', label: 'GLM 4.6', vendor: 'Z.AI', tier: 'balanced', tags: ['balanced'] },
  { id: 'z-ai/glm-4.5-air', label: 'GLM 4.5 Air', vendor: 'Z.AI', tier: 'fast', tags: ['fast'] },
]

/**
 * Migration map: old id → new id.
 * Applied transparently by `findModel` and `resolveModelId` so users with
 * persisted state from earlier releases never hit a "model not found" error.
 */
const MODEL_ALIASES = {
  // Removed/renamed in this update
  'gpt-5-nano': 'gpt-4.1-nano',
  'gpt-5-mini': 'gpt-4.1-mini',
  'claude-sonnet-4': 'claude-sonnet-4-5',
  'google/gemini-2.0-flash-exp': 'google/gemini-2.5-flash',
  'google/gemini-2.0-flash': 'google/gemini-2.5-flash',
  'google/gemini-1.5-flash': 'google/gemini-2.5-flash-lite',
  'meta-llama/llama-3.1-8b-instruct': 'meta-llama/llama-4-scout',
  'mistral-large-latest': 'mistralai/mistral-large-2411',
  'deepseek-chat': 'deepseek/deepseek-chat-v3.1',
  'deepseek-reasoner': 'deepseek/deepseek-r1-0528',
  'grok-beta': 'x-ai/grok-3',
}

const DEFAULT_MODEL_ID = 'gpt-4.1-nano'

/**
 * Resolve a model id, applying aliases. Returns a string id that is
 * guaranteed to be present in MODELS, or the default if the input is null.
 */
export function resolveModelId(id) {
  if (!id) return DEFAULT_MODEL_ID
  const aliased = MODEL_ALIASES[id] || id
  if (MODELS.some((m) => m.id === aliased)) return aliased
  return DEFAULT_MODEL_ID
}

/**
 * Look up a Model object by id. Applies aliasing. Always returns a Model;
 * falls back to the default model if the id is unknown.
 */
export function findModel(id) {
  const resolved = resolveModelId(id)
  return MODELS.find((m) => m.id === resolved) || MODELS[0]
}

export const DEFAULT_MODEL = DEFAULT_MODEL_ID

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
 * @param {string} opts.model         Model id (will be alias-resolved).
 * @param {AbortSignal} opts.signal   Optional abort signal.
 * @param {(delta:string,full:string)=>void} opts.onDelta  Called for each chunk.
 * @returns {Promise<{ text: string, aborted: boolean }>}
 */
export async function streamChat({ messages, model, signal, onDelta }) {
  const puter = await waitForPuter()
  if (!puter || !puter.ai || typeof puter.ai.chat !== 'function') {
    return fallbackEcho({ messages, signal, onDelta })
  }

  const resolvedModel = resolveModelId(model)
  let full = ''
  let aborted = false
  const onAbort = () => { aborted = true }
  signal?.addEventListener('abort', onAbort)

  try {
    const response = await puter.ai.chat(messages, { model: resolvedModel, stream: true })

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
    const r = await puter.ai.chat(messages, { model: resolveModelId(model) })
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
