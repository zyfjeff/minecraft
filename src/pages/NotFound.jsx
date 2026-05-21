// =============================================================================
// NotFound — 404 page shown for unmatched routes.
// Minecraft-themed with pixel art and a friendly message.
// =============================================================================
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--space-2xl) var(--space-lg)',
      minHeight: 400,
      gap: 'var(--space-lg)',
    }}>
      {/* Big 404 with pixel art style */}
      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 96,
          fontWeight: 900,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-surface-soft)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          404
        </div>
        {/* Floating pickaxe */}
        <svg
          width="48" height="48" viewBox="0 0 16 16"
          style={{
            position: 'absolute', top: -10, right: -20,
            imageRendering: 'pixelated',
            animation: 'float 3s ease-in-out infinite',
          }}
        >
          <rect x="10" y="0" width="2" height="2" fill="#4FC3F7" />
          <rect x="12" y="0" width="2" height="2" fill="#4FC3F7" />
          <rect x="14" y="0" width="2" height="2" fill="#4FC3F7" />
          <rect x="12" y="2" width="2" height="2" fill="#4FC3F7" />
          <rect x="10" y="4" width="2" height="2" fill="#8B6914" />
          <rect x="8" y="6" width="2" height="2" fill="#8B6914" />
          <rect x="6" y="8" width="2" height="2" fill="#8B6914" />
          <rect x="4" y="10" width="2" height="2" fill="#8B6914" />
          <rect x="2" y="12" width="2" height="2" fill="#8B6914" />
        </svg>
      </div>

      <h2 style={{
        margin: 0,
        fontSize: 22,
        fontWeight: 800,
        color: 'var(--color-title)',
        fontFamily: 'var(--font-display)',
      }}>
        Block Not Found
      </h2>

      <p style={{
        margin: 0,
        fontSize: 14,
        color: 'var(--color-muted)',
        lineHeight: 1.6,
        maxWidth: 320,
      }}>
        Looks like you mined too deep! This page doesn't exist in our world.
      </p>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          padding: '12px 24px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-grass)',
          color: '#fff',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 0 0 var(--color-grass-active)',
          transition: 'transform 80ms ease',
        }}
      >
        Return to Base
      </Link>
    </div>
  )
}
