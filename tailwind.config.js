/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#05070a',
          900: '#0a0d12',
          850: '#0d1117',
          800: '#11151c',
          700: '#161b24',
          600: '#1c222d',
          500: '#262d3a',
        },
        steel: {
          400: '#8a93a3',
          300: '#a7b0bf',
          200: '#cfd5df',
          100: '#e6e9ef',
        },
        emerald: {
          glow: '#34d399',
          deep: '#0e6b4f',
        },
        cyan: {
          glow: '#38bdf8',
          deep: '#0e4f6b',
        },
      },
      boxShadow: {
        'glass': '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.45)',
        'glass-lg': '0 1px 0 rgba(255,255,255,0.05) inset, 0 16px 60px rgba(0,0,0,0.55)',
        'emerald-soft': '0 0 0 1px rgba(52,211,153,0.18), 0 8px 32px -8px rgba(52,211,153,0.25)',
        'cyan-soft': '0 0 0 1px rgba(56,189,248,0.18), 0 8px 32px -8px rgba(56,189,248,0.25)',
      },
      backgroundImage: {
        'grid-fade': 'linear-gradient(180deg, transparent, rgba(0,0,0,0.6) 80%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'rise-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%,100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 600ms ease-out both',
        'rise-in': 'rise-in 500ms cubic-bezier(0.2,0.8,0.2,1) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.6s linear infinite',
        'border-spin': 'border-spin 8s linear infinite',
      },
    },
  },
  plugins: [],
}
