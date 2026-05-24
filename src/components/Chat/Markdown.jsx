import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import CodeBlock from './CodeBlock'

/**
 * Premium Markdown renderer:
 *  - GFM (tables, task lists, autolinks, strikethrough)
 *  - rehype-highlight for syntax coloring (atom-one-dark theme)
 *  - Custom CodeBlock wrapper for fenced blocks (copy + download)
 *  - Safe target=_blank for links
 */
export default function Markdown({ content }) {
  return (
    <div className="prose-xp">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          pre: ({ children }) => {
            // children is a single <code className="hljs language-xxx"> element
            const child = Array.isArray(children) ? children[0] : children
            const className = child?.props?.className || ''
            const match = /language-([\w-]+)/.exec(className) || []
            const lang = match[1] || 'plaintext'
            return <CodeBlock language={lang}>{child}</CodeBlock>
          },
          code: ({ inline, className, children, ...props }) => {
            if (inline) {
              return <code className={className} {...props}>{children}</code>
            }
            return <code className={className} {...props}>{children}</code>
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  )
}
