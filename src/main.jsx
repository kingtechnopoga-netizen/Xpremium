import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Remove pre-React boot fallback once React mounts
const fallback = document.getElementById('boot-fallback')
if (fallback) {
  requestAnimationFrame(() => {
    fallback.style.transition = 'opacity 400ms ease'
    fallback.style.opacity = '0'
    setTimeout(() => fallback.remove(), 450)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
