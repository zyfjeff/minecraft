// =============================================================================
// NetworkStatus — Shows a dismissable banner when the browser goes offline.
// Automatically hides when connectivity is restored.
// =============================================================================
import { useEffect, useState } from 'react'

export default function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setDismissed(false) }
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!isOffline || dismissed) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'var(--color-gold, #F5A623)',
        color: '#fff',
        fontFamily: 'var(--font-display)',
        fontSize: '13px',
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        animation: 'network-slide-in 200ms ease-out',
      }}
    >
      <span style={{ fontSize: '16px' }}>⚠️</span>
      <span>You're offline — some features may not work.</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: 'rgba(255,255,255,0.25)',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 700,
          padding: '4px 10px',
          cursor: 'pointer',
          marginLeft: '8px',
        }}
      >
        Dismiss
      </button>
      <style>{`
        @keyframes network-slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}