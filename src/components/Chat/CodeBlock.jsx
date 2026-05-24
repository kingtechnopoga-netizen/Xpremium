import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { copyText, downloadFile } from '../../lib/utils'

const EXT_BY_LANG = {
  javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', tsx: 'tsx', jsx: 'jsx',
  python: 'py', py: 'py', html: 'html', css: 'css', json: 'json', bash: 'sh',
  shell: 'sh', sh: 'sh', sql: 'sql', go: 'go', rust: 'rs', rs: 'rs',
  java: 'java', kotlin: 'kt', swift: 'swift', cpp: 'cpp', c: 'c', php: 'php',
  ruby: 'rb', md: 'md', markdown: 'md', yaml: 'yml', yml: 'yml', toml: 'toml',
}

/**
 * Premium code block used by both chat markdown and the codex preview.
 * Includes a hacker-card header with language, copy, and download.
 */
export default function CodeBlock({ language, children, code, plain }) {
  const [copied, setCopied] = useState(false)
  const text = (code ?? (typeof children === 'string' ? children : ''))
  const lang = (language || 'plaintext').toLowerCase()
  const ext = EXT_BY_LANG[lang] || 'txt'

  const onCopy = async () => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    }
  }
  const onDownload = () => {
    downloadFile(`xprem-snippet.${ext}`, text, 'text/plain')
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/5 bg-ink-900/80 shadow-glass">
      <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.025] px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-steel-400 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-glow/70" />
          <span className="truncate font-mono normal-case tracking-normal text-steel-300/90">{lang}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-steel-300 transition hover:bg-white/[0.05] hover:text-white sm:gap-1.5 sm:px-2"
            aria-label="Copy code"
          >
            {copied ? <Check size={12} className="text-emerald-glow" /> : <Copy size={12} />}
            <span className="text-[11px] normal-case tracking-normal">{copied ? 'copied' : 'copy'}</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-steel-300 transition hover:bg-white/[0.05] hover:text-white sm:gap-1.5 sm:px-2"
            aria-label="Download code"
          >
            <Download size={12} />
            <span className="text-[11px] normal-case tracking-normal">save</span>
          </button>
        </div>
      </div>
      {plain ? (
        <pre className="overflow-x-auto px-3 py-3 text-[12.5px] leading-[1.6] text-steel-100 sm:px-4 sm:text-[13px]">{text}</pre>
      ) : (
        <pre className="overflow-x-auto px-3 py-3 sm:px-4">{children}</pre>
      )}
    </div>
  )
}
