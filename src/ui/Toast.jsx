import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

/**
 * Lightweight, dependency-free toast system.
 *
 * Design intent:
 * - Single global stack, fixed bottom-right, max-stacked vertically.
 * - Each toast auto-dismisses after `DURATION_MS`; the timer is owned by
 *   ToastProvider (not the toast component) so re-renders don't reset it.
 * - `useToast()` returns 3 sugar methods (success/error/info); `kind` is just
 *   used to pick a color token, behavior is identical across kinds.
 * - The provider does NOT depend on AuthContext, so it can be mounted above
 *   or below AuthProvider in main.jsx — we choose "inside AuthProvider" so
 *   that future code in AuthContext could push toasts via React events.
 */

const DURATION_MS = 2500

const ToastContext = createContext(null)

const KIND_COLOR = {
  success: { bg: 'var(--color-grass)', fg: '#FFFFFF' },
  error:   { bg: '#E05A5A',             fg: '#FFFFFF' },
  info:    { bg: 'var(--color-title)',  fg: '#FFFFFF' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  // Auto-incrementing id; useRef so it survives renders without forcing one.
  const seqRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((kind, text) => {
    const id = ++seqRef.current
    setToasts((cur) => [...cur, { id, kind, text }])
    // Fire-and-forget timer; if the toast is already gone (e.g. unmounted),
    // dismiss is a no-op filter so this is safe.
    setTimeout(() => dismiss(id), DURATION_MS)
  }, [dismiss])

  const api = useMemo(() => ({
    success: (text) => push('success', text),
    error:   (text) => push('error', text),
    info:    (text) => push('info', text),
  }), [push])

  return (
    <ToastContext.Provider value={api} data-qoder-id="qel-toastcontext-provider-4b0d4900" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toastcontext-provider-4b0d4900&quot;,&quot;filePath&quot;:&quot;react-vite/src/ui/Toast.jsx&quot;,&quot;componentName&quot;:&quot;ToastProvider&quot;,&quot;elementRole&quot;:&quot;toastcontext-provider&quot;,&quot;loc&quot;:{&quot;line&quot;:51,&quot;column&quot;:5}}">
      {children}
      <div
        // Container is non-interactive (pointer-events:none) so toasts don't
        // block clicks behind them; individual toasts re-enable pointer events
        // if we ever add a close button.
        style={{
          position: 'fixed',
          bottom: 'calc(72px + var(--space-md))', // sit above bottom-nav
          right: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
        aria-live="polite"
        aria-atomic="false"
       data-qoder-id="qel-div-9d1483b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9d1483b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/ui/Toast.jsx&quot;,&quot;componentName&quot;:&quot;ToastProvider&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:53,&quot;column&quot;:7}}">
        {toasts.map((t) => {
          const c = KIND_COLOR[t.kind] || KIND_COLOR.info
          return (
            <div
              key={t.id}
              role="status"
              style={{
                background: c.bg,
                color: c.fg,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: 200,
                maxWidth: 320,
                animation: 'qoder-toast-in 180ms ease-out',
              }}
             data-qoder-id="qel-div-9e148547" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9e148547&quot;,&quot;filePath&quot;:&quot;react-vite/src/ui/Toast.jsx&quot;,&quot;componentName&quot;:&quot;ToastProvider&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:13}}">
              {t.text}
            </div>
          )
        })}
      </div>
      {/* Local keyframes — small enough to inline so we don't have to touch
          styles.css; safe to mount multiple times because it's name-scoped. */}
      <style data-qoder-id="qel-style-ff2bba62" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-style-ff2bba62&quot;,&quot;filePath&quot;:&quot;react-vite/src/ui/Toast.jsx&quot;,&quot;componentName&quot;:&quot;ToastProvider&quot;,&quot;elementRole&quot;:&quot;style&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:7}}">{`
        @keyframes qoder-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Defensive: if a component calls useToast outside the provider we don't
    // want to crash the page; return no-op stubs and warn once.
    if (typeof console !== 'undefined') {
      console.warn('[ui] useToast called outside <ToastProvider>; toasts will be no-ops')
    }
    return { success: () => {}, error: () => {}, info: () => {} }
  }
  return ctx
}
