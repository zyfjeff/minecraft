// =============================================================================
// ErrorBoundary — Global error boundary to catch render errors.
// Prevents white-screen crashes by showing a friendly recovery UI.
// =============================================================================
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info?.componentStack)
    // Best-effort telemetry. The reporter mirrors the global async-error sink
    // in main.jsx; both stay no-ops unless VITE_ERROR_SINK_URL is configured.
    try {
      const sink = import.meta.env?.VITE_ERROR_SINK_URL
      if (!sink || typeof navigator === 'undefined' || !navigator.sendBeacon) return
      const body = JSON.stringify({
        kind: 'react.render',
        message: error?.message || String(error),
        stack: error?.stack || null,
        componentStack: info?.componentStack || null,
        url: typeof location !== 'undefined' ? location.href : null,
        ts: Date.now(),
      })
      navigator.sendBeacon(sink, new Blob([body], { type: 'application/json' }))
    } catch (_) {
      /* never let the reporter throw */
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  // Sanitise error messages to avoid leaking internal URLs, table names, etc.
  getSafeMessage() {
    const raw = this.state.error?.message || ''
    if (!raw) return 'An unexpected error occurred.'
    // Strip anything that looks like a URL or supabase reference.
    return raw
      .replace(/https?:\/\/[^\s)]+/g, '[url]')
      .replace(/supabase[^\s,]*/gi, '[service]')
      .slice(0, 200)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        background: 'var(--color-cream)',
        fontFamily: 'var(--font-display)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl) var(--space-lg)',
          boxShadow: 'var(--shadow-card-hover)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-md)',
        }}>
          {/* Creeper face icon */}
          <svg width="64" height="64" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
            <rect width="16" height="16" fill="#4CAF50" rx="2" />
            <rect x="3" y="3" width="4" height="4" fill="#1B5E20" />
            <rect x="9" y="3" width="4" height="4" fill="#1B5E20" />
            <rect x="6" y="7" width="4" height="2" fill="#1B5E20" />
            <rect x="5" y="9" width="6" height="3" fill="#1B5E20" />
            <rect x="5" y="12" width="2" height="2" fill="#1B5E20" />
            <rect x="9" y="12" width="2" height="2" fill="#1B5E20" />
          </svg>

          <h2 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--color-title)',
          }}>
            Oops! Something Exploded
          </h2>

          <p style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--color-muted)',
            lineHeight: 1.6,
            maxWidth: 320,
          }}>
            A Creeper snuck in and broke something. Don't worry — your progress is safe!
          </p>

          {this.state.error && (
            <div style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              background: '#FDECEC',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: 'var(--color-danger)',
              textAlign: 'left',
              wordBreak: 'break-word',
              maxHeight: 80,
              overflow: 'auto',
            }}>
              {this.getSafeMessage()}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-sm)', width: '100%', marginTop: 'var(--space-sm)' }}>
            <button
              onClick={this.handleReset}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'var(--color-surface-soft)',
                color: 'var(--color-title)',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'var(--color-grass)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 0 0 var(--color-grass-active)',
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
