// =============================================================================
// theme.js — Tiny client-side theme controller.
//
// Three modes: 'auto' (default, follows prefers-color-scheme), 'light', 'dark'.
// 'light' / 'dark' set [data-theme] on <html>, which the CSS layer in
// styles.css uses to override --color-* tokens. 'auto' clears the attribute
// so the @media (prefers-color-scheme: dark) block in styles.css takes over.
//
// Persisted under localStorage('theme'). initTheme() must be called once at
// app boot — main.jsx does this — so the first paint already has the right
// tokens (no FOUC flash).
// =============================================================================
const STORAGE_KEY = 'theme'
const VALID = new Set(['auto', 'light', 'dark'])

export function getTheme() {
  if (typeof window === 'undefined') return 'auto'
  const v = window.localStorage?.getItem(STORAGE_KEY)
  return VALID.has(v) ? v : 'auto'
}

export function setTheme(theme) {
  if (!VALID.has(theme)) return
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage may be disabled in private mode; we still apply in-memory.
  }
  applyTheme(theme)
}

// Apply attribute on <html> based on chosen theme. 'auto' removes the
// attribute so CSS media query takes over.
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme)
  } else {
    root.removeAttribute('data-theme')
  }
}

// Reads stored preference and applies it. Idempotent.
export function initTheme() {
  applyTheme(getTheme())
}

// Returns 'light' | 'dark' — the *effective* theme right now. Useful for any
// JS that needs to branch (e.g., picking a chart palette). Not used by CSS.
export function getEffectiveTheme() {
  const stored = getTheme()
  if (stored === 'light' || stored === 'dark') return stored
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
