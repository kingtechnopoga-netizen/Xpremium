# XPremChatbot

> An elite, cinematic AI operating system for hackers, AI engineers, and advanced developers.
> Built with React + Vite + Tailwind, powered by [puter.js](https://js.puter.com/v2/).

XPremChatbot is a single-page web app that streams responses from multiple frontier
models, renders Markdown with syntax-highlighted code, persists everything locally,
and ships with a built-in coding workspace ("Codex") with live HTML/CSS/JS preview
and AI explain / refactor / debug actions.

It was designed to feel **smooth, premium, stealthy, and cinematic** — without
falling into rainbow-neon cyberpunk clichés.

---

## Features

- **Multi-model AI chat** — GPT-5 / GPT-4o, Claude Sonnet, Gemini, Llama, Mistral,
  DeepSeek, Grok and more, all routed through puter.js.
- **Streaming responses** with token-by-token rendering, animated cursor, and an
  abortable "stop" control.
- **Markdown + syntax highlighting** (GFM tables, code fences, autolinks),
  with copy + download buttons on every code block.
- **Image and file uploads** — vision-capable models accept image attachments;
  small text files are inlined as fenced code blocks.
- **Regenerate**, **continue**, **edit**, **delete**, and **copy** on any message.
- **Smart auto-scroll** that respects manual scroll-up.
- **AI-generated chat titles** on the first turn.
- **Persistent AI memory** injected into every prompt as a system note.
- **Custom system prompts** with a quick reset.
- **Conversation folders**, **pinned chats**, full-text **search**.
- **Codex coding workspace**: multi-file editor, sandboxed live preview,
  AI explain / refactor / debug actions streamed into a console panel.
- **Mobile-first**, thumb-friendly bottom navigation, safe-area aware,
  optimised for 4 GB Android devices.
- **Cinematic background**: matte gradients, soft aurora blobs, animated grid,
  GPU-friendly canvas particles + subtle code-rain glyphs.
- **Local-first persistence** via `localStorage` (Zustand). Export/import full state.
- **Donation footer** with copy-to-clipboard GCash badge.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle in ./dist
npm run preview      # serve the production bundle locally
```

You don't need any API keys — all AI calls go through puter.js, which handles
authentication on its own. The puter.js script is loaded automatically by
`index.html`.

### Optional environment variables

Copy `.env.example` to `.env` and tweak:

```bash
VITE_DEFAULT_MODEL=gpt-5-nano          # any puter.js-supported model id
VITE_SHOW_DIAGNOSTICS=false
```

---

## Deploy on Render (recommended)

XPremChatbot is a pure static site — no server needed.

### Option 1 — `render.yaml` (zero-config)

This repo includes a [`render.yaml`](./render.yaml) blueprint. From the Render
dashboard:

1. **New → Blueprint** → connect this GitHub repo.
2. Render reads `render.yaml` and provisions a static site:
   - Build command: `npm install && npm run build`
   - Publish path: `./dist`
   - SPA fallback: all routes rewrite to `/index.html`
   - Long-lived caching for hashed asset bundles
3. Click **Apply**. First deploy takes ~2 minutes.

### Option 2 — manual static site

1. Render dashboard → **New → Static Site**.
2. Connect this repo.
3. Configure:
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
   - **Rewrite rule:** `/* → /index.html` (status 200)
4. Deploy.

### Custom domain

Add it under **Settings → Custom Domains** on Render and follow the DNS
instructions. HTTPS is provisioned automatically.

---

## Deploy elsewhere

The build output in `dist/` is a plain static bundle. It works on any static
host: Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 + CloudFront.
The only requirement is **SPA fallback to `index.html`**.

---

## Architecture

```
src/
├── main.jsx                     # React bootstrap, removes pre-React boot fallback
├── App.jsx                      # Shell: layout, modals, shortcuts, routing
├── index.css                    # Tailwind + design tokens + glass / prose / hljs
├── lib/
│   ├── puter.js                 # streamChat / completeOnce / MODELS / fallbacks
│   └── utils.js                 # uid, copy, download, file readers, time format
├── store/
│   └── chatStore.js             # Zustand + persist middleware
└── components/
    ├── Background/CinematicBackground.jsx
    ├── Splash/BootSequence.jsx
    ├── Layout/{Sidebar, TopBar, BottomNav}.jsx
    ├── Chat/{ChatView, Message, Composer, Markdown, CodeBlock, EmptyState, TypingIndicator}.jsx
    ├── Codex/CodexWorkspace.jsx
    ├── Settings/{SettingsPanel, ModelSelector}.jsx
    ├── Memory/MemoryManager.jsx
    ├── Footer/DonationFooter.jsx
    └── UI/{Brand, Modal, Toast}.jsx
```

### puter.js integration

`src/lib/puter.js` exposes:

- `MODELS` — a curated, ordered list of model ids exposed to the picker.
- `buildMessages({ messages, systemPrompt, memory })` — builds the OpenAI-style
  message array, injecting persistent memory into the system prompt and
  formatting image attachments as multimodal content.
- `streamChat({ messages, model, signal, onDelta })` — async iterable streaming
  with chunk-shape normalisation. Aborts cleanly via `AbortController`.
- `completeOnce({ messages, model })` — single-shot completion, used for
  AI-generated chat titles.
- A graceful **offline fallback** that pretends to stream an apologetic
  message so the UI never feels broken when puter.js can't be reached.

### Local-first persistence

Everything (chats, folders, pinned, memory, settings, system prompt) is
persisted to `localStorage` under `xprem-chat-store-v1` using Zustand's
`persist` middleware. The Codex workspace stores files separately under
`xprem-codex-files`. Use **Settings → Data** to export or import everything as JSON.

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘` / `Ctrl` + `N` | New conversation |
| `⌘` / `Ctrl` + `K` | Open model picker |
| `⌘` / `Ctrl` + `,` | Settings |
| `⌘` / `Ctrl` + `B` | Toggle sidebar |
| `Enter` | Send (configurable) |
| `Shift` + `Enter` | New line |
| `Esc` | Close menus / modals |

---

## Donations

If you enjoy using XPremChatbot and want to support the creator, you can donate
**kahit barya lang**. Any amount is appreciated.

**GCash:** `09482887486`

The donation panel inside the app provides a one-click copy button.

---

## Tech stack

- **React 18** + **Vite 5** + **TailwindCSS 3**
- **Framer Motion** for entrance/exit animations
- **Zustand** with `persist` for state management
- **react-markdown** + **remark-gfm** + **rehype-highlight** + **highlight.js**
- **lucide-react** for iconography
- **puter.js** for the AI runtime

---

## License

MIT — do whatever you want, but please be kind.
