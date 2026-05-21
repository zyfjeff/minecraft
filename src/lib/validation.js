// =============================================================================
// Shared form validation utilities.
// Used by Login, Profile, and any future form that needs consistent rules.
// =============================================================================

/** Lightweight email regex — matches the pattern used across the app. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate an email string.
 * @returns {string} Error message, or '' if valid.
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.'
  if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.'
  return ''
}

/**
 * Validate a password string.
 * @param {string} password
 * @param {{ minLength?: number }} opts
 * @returns {string} Error message, or '' if valid.
 */
export function validatePassword(password, { minLength = 8 } = {}) {
  if (!password) return 'Password is required.'
  if (password.length < minLength) return `Password must be at least ${minLength} characters.`
  return ''
}

/**
 * Validate a display name.
 * @param {string} name
 * @param {{ maxLength?: number }} opts
 * @returns {string} Error message, or '' if valid.
 */
export function validateDisplayName(name, { maxLength = 20 } = {}) {
  const trimmed = (name || '').trim()
  if (!trimmed) return 'Display name cannot be empty.'
  if (trimmed.length > maxLength) return `Display name must be ${maxLength} characters or fewer.`
  return ''
}

/**
 * Validate that two passwords match.
 * @returns {string} Error message, or '' if they match.
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}
