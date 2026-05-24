export function BrandLogo({ size = 28 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="brand-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path
        d="M18 18 L32 32 L18 46 M46 18 L32 32 L46 46"
        fill="none"
        stroke="url(#brand-grad)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="2.2" fill="#e6e9ef" />
    </svg>
  )
}

export function BrandWordmark({ className = '' }) {
  return (
    <span className={`font-display tracking-tight ${className}`}>
      XPrem<span className="text-accent-gradient">Chatbot</span>
    </span>
  )
}
