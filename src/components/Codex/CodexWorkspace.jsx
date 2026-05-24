import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Play, Code2, Eye, Wand2, Bug, Lightbulb, Download, Copy, Check, FileCode2, Plus, Trash2, Cpu,
} from 'lucide-react'
import { copyText, downloadFile, uid } from '../../lib/utils'
import { useChatStore } from '../../store/chatStore'
import { completeOnce, streamChat, findModel } from '../../lib/puter'
import { useToast } from '../UI/Toast'

const STARTER_FILES = () => [
  {
    id: uid('f'),
    name: 'index.html',
    lang: 'html',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>XPrem · Codex</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main>
      <h1>Hello, operator</h1>
      <p>Edit the files. The preview updates live.</p>
      <button id="ping">ping</button>
    </main>
    <script src="script.js"></script>
  </body>
</html>
`,
  },
  {
    id: uid('f'),
    name: 'style.css',
    lang: 'css',
    content: `:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif;
  background: radial-gradient(60% 50% at 50% 30%, #11151c, #05070a 70%);
  color: #e6e9ef; min-height: 100vh; display: grid; place-items: center; }
main { text-align: center; padding: 24px; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; background: rgba(20,26,36,0.5); backdrop-filter: blur(8px); }
h1 { font-weight: 600; letter-spacing: -0.01em; margin: 0 0 8px;
  background: linear-gradient(135deg, #34d399, #38bdf8);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
button { margin-top: 12px; padding: 8px 14px; border-radius: 10px;
  border: 1px solid rgba(52,211,153,0.4); background: rgba(52,211,153,0.12);
  color: #ecfdf5; cursor: pointer; }
`,
  },
  {
    id: uid('f'),
    name: 'script.js',
    lang: 'javascript',
    content: `document.getElementById('ping').addEventListener('click', () => {
  const t = new Date().toLocaleTimeString();
  document.querySelector('p').textContent = 'pong · ' + t;
});
`,
  },
]

const EXT_TO_LANG = {
  html: 'html', htm: 'html', css: 'css', js: 'javascript', mjs: 'javascript',
  ts: 'typescript', tsx: 'tsx', jsx: 'jsx', json: 'json', md: 'markdown',
  py: 'python', sh: 'bash', sql: 'sql',
}

/**
 * Codex coding workspace.
 *  - Multi-file editor (textarea, mobile-safe)
 *  - Live HTML/CSS/JS preview via srcdoc bundling
 *  - AI explain / refactor / debug actions stream into a side console
 */
export default function CodexWorkspace() {
  const toast = useToast()
  const model = useChatStore((s) => s.getActiveModel())
  const defaultModel = useChatStore((s) => s.defaultModel)
  const setModelPickerOpen = useChatStore((s) => s.setModelPickerOpen)
  const systemPrompt = useChatStore((s) => s.systemPrompt)
  const memory = useChatStore((s) => s.memory)

  const [files, setFiles] = useState(() => {
    try {
      const raw = localStorage.getItem('xprem-codex-files')
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return STARTER_FILES()
  })
  const [activeId, setActiveId] = useState(() => null)
  const [tab, setTab] = useState('split') // 'code' | 'preview' | 'split'
  const [running, setRunning] = useState(0) // bumps to refresh iframe
  const [aiOutput, setAiOutput] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!activeId && files[0]) setActiveId(files[0].id)
  }, [files, activeId])

  useEffect(() => {
    try { localStorage.setItem('xprem-codex-files', JSON.stringify(files)) } catch { /* quota */ }
  }, [files])

  const activeFile = files.find((f) => f.id === activeId) || null

  const previewSrcDoc = useMemo(() => {
    const html = files.find((f) => f.lang === 'html')?.content || '<!doctype html><html><body></body></html>'
    const css = files.filter((f) => f.lang === 'css').map((f) => f.content).join('\n')
    const js = files.filter((f) => f.lang === 'javascript').map((f) => f.content).join(';\n')
    // Inject CSS + JS — strip references to local files which won't resolve in srcdoc
    let merged = html
    merged = merged.replace(/<link[^>]*href="(?:[^"]*\.css)"[^>]*>/gi, '')
    merged = merged.replace(/<script[^>]*src="(?:[^"]*\.js)"[^>]*><\/script>/gi, '')
    if (css) merged = merged.replace(/<\/head>/i, `<style>${css}</style></head>`)
    if (js) merged = merged.replace(/<\/body>/i, `<script>(function(){try{${js}}catch(e){console.error(e)}})();</script></body>`)
    return merged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, running])

  const updateActive = (content) => {
    if (!activeFile) return
    setFiles((s) => s.map((f) => (f.id === activeFile.id ? { ...f, content } : f)))
  }

  const addFile = () => {
    const name = window.prompt('File name (e.g. utils.js, page.css, todo.md)', 'untitled.js')
    if (!name) return
    const ext = name.split('.').pop()?.toLowerCase()
    const lang = EXT_TO_LANG[ext] || 'plaintext'
    const f = { id: uid('f'), name, lang, content: '' }
    setFiles((s) => [...s, f])
    setActiveId(f.id)
  }

  const removeFile = (id) => {
    if (files.length <= 1) {
      toast.push('keep at least one file', { kind: 'info' })
      return
    }
    if (!confirm('Delete this file?')) return
    setFiles((s) => s.filter((f) => f.id !== id))
    if (activeId === id) setActiveId(files.find((f) => f.id !== id)?.id || null)
  }

  const downloadActive = () => {
    if (!activeFile) return
    downloadFile(activeFile.name, activeFile.content, 'text/plain')
  }

  const copyActive = async () => {
    if (!activeFile) return
    const ok = await copyText(activeFile.content)
    toast.push(ok ? 'copied' : 'copy failed', { kind: ok ? 'success' : 'error' })
  }

  const runAI = async (kind) => {
    if (!activeFile) return
    setAiBusy(true)
    setAiOpen(true)
    setAiOutput('')

    const intro = {
      explain: 'Explain this code clearly. Highlight intent, key flows, edge cases, and any bugs.',
      refactor: 'Refactor this code for clarity, performance, and modern idioms. Preserve behavior. Return the full refactored file in a fenced code block, then a brief change list.',
      debug: 'Carefully analyze this code for bugs, edge cases, and security issues. List findings with severity, then propose fixes with code examples.',
    }[kind] || 'Analyze this code.'

    const prompt = [
      { role: 'system', content: systemPrompt + (memory ? `\n\n[Persistent memory]\n${memory}` : '') },
      { role: 'user', content: `${intro}\n\nFile: ${activeFile.name}\n\n\`\`\`${activeFile.lang}\n${activeFile.content}\n\`\`\`` },
    ]

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat({
        messages: prompt,
        model: defaultModel,
        signal: controller.signal,
        onDelta: (_d, full) => setAiOutput(full),
      })
    } catch (e) {
      setAiOutput((s) => s + `\n\n⚠ ${e?.message || 'AI request failed.'}`)
    } finally {
      setAiBusy(false)
      abortRef.current = null
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b hairline glass px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-glow/10 text-emerald-glow ring-1 ring-emerald-glow/25">
            <Code2 size={14} />
          </div>
          <div>
            <div className="text-[12px] font-medium text-steel-100">Codex</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-steel-400">live workspace</div>
          </div>
        </div>

        <div className="ml-2 hidden items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 sm:inline-flex">
          <Tab active={tab === 'code'} onClick={() => setTab('code')}>
            <Code2 size={12} /> Code
          </Tab>
          <Tab active={tab === 'split'} onClick={() => setTab('split')}>
            <FileCode2 size={12} /> Split
          </Tab>
          <Tab active={tab === 'preview'} onClick={() => setTab('preview')}>
            <Eye size={12} /> Preview
          </Tab>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setRunning((n) => n + 1)} className="btn-ghost">
            <Play size={12} /> Run
          </button>
          <button type="button" onClick={copyActive} className="btn-ghost">
            <Copy size={12} /> Copy
          </button>
          <button type="button" onClick={downloadActive} className="btn-ghost">
            <Download size={12} /> Save
          </button>
          <div className="mx-1 hidden h-5 w-px bg-white/[0.06] sm:block" />
          <button type="button" onClick={() => runAI('explain')} disabled={aiBusy} className="btn-ghost">
            <Lightbulb size={12} /> Explain
          </button>
          <button type="button" onClick={() => runAI('refactor')} disabled={aiBusy} className="btn-ghost">
            <Wand2 size={12} /> Refactor
          </button>
          <button type="button" onClick={() => runAI('debug')} disabled={aiBusy} className="btn-ghost">
            <Bug size={12} /> Debug
          </button>
          <button
            type="button"
            onClick={() => setModelPickerOpen(true)}
            className="btn-ghost"
            title="Switch model"
          >
            <Cpu size={12} />
            <span className="hidden md:inline">{model.label}</span>
          </button>
        </div>
      </div>

      {/* Mobile tab toggle */}
      <div className="flex items-center gap-1 px-3 pt-2 sm:hidden">
        <Tab active={tab === 'code'} onClick={() => setTab('code')}><Code2 size={12} /> Code</Tab>
        <Tab active={tab === 'preview'} onClick={() => setTab('preview')}><Eye size={12} /> Preview</Tab>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-12">
        {/* File explorer */}
        <aside
          className={`col-span-2 hidden min-h-0 border-r hairline bg-ink-900/40 sm:flex sm:flex-col ${
            tab === 'preview' ? 'sm:hidden' : ''
          }`}
        >
          <div className="flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-steel-400">
            <span>files</span>
            <button
              type="button"
              onClick={addFile}
              className="grid h-6 w-6 place-items-center rounded-md text-steel-300 hover:bg-white/[0.05] hover:text-white"
              aria-label="Add file"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 pb-2">
            {files.map((f) => (
              <div key={f.id} className="group/fl flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveId(f.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] ${
                    activeId === f.id
                      ? 'bg-white/[0.05] text-white'
                      : 'text-steel-300 hover:bg-white/[0.03] hover:text-steel-100'
                  }`}
                >
                  <FileCode2 size={12} className="text-steel-400" />
                  <span className="truncate font-mono">{f.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="grid h-6 w-6 place-items-center rounded-md text-steel-400 opacity-0 transition hover:bg-white/[0.05] hover:text-red-300 group-hover/fl:opacity-100"
                  aria-label="Delete file"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <section
          className={`min-h-0 ${
            tab === 'preview'
              ? 'hidden'
              : tab === 'split'
              ? 'sm:col-span-5'
              : 'sm:col-span-10'
          } col-span-1 flex flex-col`}
        >
          <div className="flex items-center gap-2 border-b hairline px-3 py-1.5 text-[11px] text-steel-400">
            <span className="font-mono text-steel-200">{activeFile?.name || 'no file'}</span>
            <span className="text-steel-400/60">·</span>
            <span>{activeFile?.lang || ''}</span>
          </div>
          <div className="relative min-h-0 flex-1">
            <textarea
              value={activeFile?.content || ''}
              onChange={(e) => updateActive(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 h-full w-full resize-none bg-ink-900/70 px-4 py-3 font-mono text-[12.5px] leading-[1.65] text-steel-100 outline-none"
              placeholder="// start writing code…"
            />
          </div>
        </section>

        {/* Preview */}
        <section
          className={`col-span-1 min-h-0 border-t hairline sm:border-l sm:border-t-0 ${
            tab === 'code'
              ? 'hidden'
              : tab === 'split'
              ? 'sm:col-span-5'
              : 'sm:col-span-10'
          } flex flex-col`}
        >
          <div className="flex items-center justify-between border-b hairline px-3 py-1.5 text-[11px] text-steel-400">
            <span>live preview</span>
            <span className="font-mono text-steel-400/70">srcdoc · sandboxed</span>
          </div>
          <iframe
            key={running}
            title="Codex preview"
            sandbox="allow-scripts allow-pointer-lock allow-modals"
            srcDoc={previewSrcDoc}
            className="min-h-0 flex-1 w-full bg-white"
          />
        </section>
      </div>

      {/* AI console */}
      {aiOpen && (
        <div className="border-t hairline bg-ink-900/85">
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-steel-400">
            <span className="font-mono">codex · ai console</span>
            <span className="text-steel-400/60">· {model.label}</span>
            {aiBusy && <span className="text-emerald-glow animate-pulse-soft">streaming…</span>}
            <div className="ml-auto flex items-center gap-1.5">
              {aiBusy && (
                <button type="button" onClick={() => abortRef.current?.abort()} className="btn-ghost btn-danger">
                  Stop
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(aiOutput || '')
                  toast.push(ok ? 'copied' : 'copy failed', { kind: ok ? 'success' : 'error' })
                }}
                className="btn-ghost"
              >
                <Copy size={12} /> Copy
              </button>
              <button type="button" onClick={() => setAiOpen(false)} className="btn-ghost">Close</button>
            </div>
          </div>
          <pre className="max-h-[34vh] overflow-y-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12.5px] leading-[1.65] text-steel-200">
{aiOutput || (aiBusy ? '' : '// AI output will appear here.')}
          </pre>
        </div>
      )}
    </div>
  )
}

function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition ${
        active ? 'bg-white/[0.07] text-white' : 'text-steel-300 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
