import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedDemoData } from './lib/demoData'

if (import.meta.env.VITE_DEMO === '1') {
  seedDemoData()
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // updateViaCache 'none': the phone always re-downloads sw.js to check for a new version
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
