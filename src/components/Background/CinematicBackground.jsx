import { useEffect, useRef } from 'react'
import { useChatStore } from '../../store/chatStore'

/**
 * CinematicBackground
 *
 * Layered, GPU-friendly background:
 *  - Deep matte radial gradient
 *  - Soft moving aurora blobs (CSS)
 *  - Animated grid overlay
 *  - Canvas particle field with subtle code rain (low density on mobile)
 *  - Noise + vignette
 *
 * Density adapts to `bgIntensity` setting. Pauses when tab is hidden.
 */
export default function CinematicBackground() {
  const intensity = useChatStore((s) => s.bgIntensity)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    if (intensity === 'minimal') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = 0, h = 0, dpr = 1
    let particles = []
    let glyphs = []
    let visible = !document.hidden

    const isMobile = window.matchMedia?.('(max-width: 768px)').matches
    const cinematic = intensity === 'cinematic'
    const particleCount = cinematic ? (isMobile ? 36 : 80) : (isMobile ? 18 : 44)
    const glyphCount = cinematic ? (isMobile ? 10 : 22) : (isMobile ? 5 : 12)

    const charset = '01アイウエオカサタナハマラワABCDEF{}[]<>+=*/'

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const seed = () => {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        a: 0.18 + Math.random() * 0.35,
        hue: Math.random() < 0.5 ? 'emerald' : 'cyan',
      }))
      glyphs = Array.from({ length: glyphCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        v: 0.25 + Math.random() * 0.6,
        size: 10 + Math.random() * 4,
        ch: charset[Math.floor(Math.random() * charset.length)],
        a: 0.05 + Math.random() * 0.10,
        ttl: 200 + Math.random() * 400,
      }))
    }

    const draw = () => {
      if (!visible) { rafRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, w, h)

      // Particles (soft glowing dots)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -8) p.x = w + 8
        if (p.x > w + 8) p.x = -8
        if (p.y < -8) p.y = h + 8
        if (p.y > h + 8) p.y = -8

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6)
        const color = p.hue === 'emerald' ? '52,211,153' : '56,189,248'
        grad.addColorStop(0, `rgba(${color},${p.a})`)
        grad.addColorStop(1, `rgba(${color},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Subtle code-rain glyphs (very low density)
      ctx.font = `500 12px 'JetBrains Mono', monospace`
      for (const g of glyphs) {
        g.y += g.v
        g.ttl -= 1
        if (g.y > h + 20 || g.ttl <= 0) {
          g.x = Math.random() * w
          g.y = -20
          g.ch = charset[Math.floor(Math.random() * charset.length)]
          g.ttl = 200 + Math.random() * 400
          g.a = 0.05 + Math.random() * 0.10
        }
        ctx.fillStyle = `rgba(180,210,220,${g.a})`
        ctx.fillText(g.ch, g.x, g.y)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    const onVis = () => { visible = !document.hidden }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    document.addEventListener('visibilitychange', onVis)
    resize()
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [intensity])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Base radial */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 70% at 50% 0%, rgba(20,28,38,0.85) 0%, rgba(8,11,16,1) 55%, #05070a 100%)',
        }}
      />

      {/* Aurora blobs */}
      {intensity !== 'minimal' && (
        <>
          <div
            className="absolute -top-40 -left-40 h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(16,80,72,0.55) 0%, rgba(16,80,72,0) 60%)',
              animation: 'auroraA 22s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute -bottom-48 -right-32 h-[55vmax] w-[55vmax] rounded-full opacity-35 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(14,79,107,0.6) 0%, rgba(14,79,107,0) 60%)',
              animation: 'auroraB 28s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute top-1/3 left-1/2 h-[42vmax] w-[42vmax] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0) 60%)',
              animation: 'auroraC 32s ease-in-out infinite alternate',
            }}
          />
        </>
      )}

      {/* Animated grid */}
      <div
        className="absolute inset-0 grid-overlay opacity-[0.55]"
        style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)' }}
      />

      {/* Particle canvas */}
      {intensity !== 'minimal' && (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}

      {/* Noise + vignette */}
      <div className="absolute inset-0 noise opacity-50 mix-blend-overlay" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <style>{`
        @keyframes auroraA { 0%{ transform: translate(0,0) scale(1); } 100%{ transform: translate(8%, 6%) scale(1.08); } }
        @keyframes auroraB { 0%{ transform: translate(0,0) scale(1); } 100%{ transform: translate(-6%, -4%) scale(1.1); } }
        @keyframes auroraC { 0%{ transform: translate(-50%, 0) scale(1); } 100%{ transform: translate(-50%, -6%) scale(1.06); } }
      `}</style>
    </div>
  )
}
