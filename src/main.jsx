import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Remove the pre-React boot fallback once React mounts.
// Defensive: also remove on `load` and after a hard timeout, so the fallback
// never gets stuck on slow connections or if React's initial mount fails.
function dismissBootFallback() {
  const el = document.getElementById('boot-fallback')
  if (!el) return
  el.style.transition = 'opacity 400ms ease'
  el.style.opacity = '0'
  setTimeout(() => el.remove(), 450)
}

requestAnimationFrame(dismissBootFallback)
window.addEventListener('load', () => setTimeout(dismissBootFallback, 50))
setTimeout(dismissBootFallback, 6000) // hard timeout fallback

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
